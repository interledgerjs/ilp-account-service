import { loadModuleOfType, composeMiddleware } from '../lib/utils'
import {
  Middleware,
  MiddlewareDefinition,
  MiddlewareMethod,
  MiddlewareConstructor,
  Pipeline,
  Pipelines
} from '../types/middleware'
import { MoneyHandler, PluginInstance } from '../types/plugin'
import MiddlewarePipeline from '../lib/middleware-pipeline'
import { IlpPrepare, Errors, IlpReply, IlpPacketHander } from 'ilp-packet'
import { AccountService } from '../types/account-service'
import Stats from './stats'
import { AccountEntry } from '../types/accounts'
const { UnreachableError } = Errors

interface VoidHandler {
  (dummy: void): Promise<void>
}

const BUILTIN_MIDDLEWARES: { [key: string]: MiddlewareDefinition } = {
  errorHandler: {
    type: 'error-handler'
  },
  rateLimit: {
    type: 'rate-limit'
  },
  throughput: {
    type: 'throughput'
  },
  balance: {
    type: 'balance'
  },
  expire: {
    type: 'expire'
  }
}

export default class MiddlewareManager {

  protected startupPipeline?: VoidHandler
  protected outgoingIlpPacketPipeline?: IlpPacketHander
  protected outgoingMoneyPipeline?: MoneyHandler
  protected shutdownPipeline?: VoidHandler
  protected middlewares: { [key: string]: Middleware }
  protected getInfo: () => AccountEntry
  protected stats: Stats

  constructor (accountService: AccountService, disabledMiddleWare: string[]) {

    const disabledMiddlewareConfig: string[] = disabledMiddleWare || []

    this.middlewares = {}
    this.getInfo = () => { return accountService }
    this.stats = new Stats(accountService.id)

    for (const name of Object.keys(BUILTIN_MIDDLEWARES)) {
      if (disabledMiddlewareConfig[name]) {
        continue
      }
      const { type, options } = BUILTIN_MIDDLEWARES[name]
      const Middleware: MiddlewareConstructor = loadModuleOfType('middleware', type)

      this.middlewares[name] = new Middleware(options || {}, {
        stats: this.stats,
        getInfo: this.getInfo.bind(this),
        getOwnAddress: () => { return '' }, // TODO - This is used in the triggeredBy field of reject messages, what should it be
        sendMoney: this.sendOutgoingMoney.bind(this)
      })

    }
  }

  /**
   * Executes middleware hooks for startup.
   *
   * This should be called after the plugins are connected
   */
  async startup () {
    if (this.startupPipeline) await this.startupPipeline(undefined)
  }

  async shutdown () {
    if (this.shutdownPipeline) await this.shutdownPipeline(undefined)
  }

  public async setupHandlers (handlers: {
    outgoingMoney: MoneyHandler,
    outgoingIlpPacket: IlpPacketHander,
    incomingMoney: MoneyHandler,
    incomingIlpPacket: IlpPacketHander
  }): Promise<{ incomingIlpPacketPipeline: IlpPacketHander, incomingMoneyPipeline: MoneyHandler }> {
    const {
      outgoingMoney,
      outgoingIlpPacket,
      incomingMoney,
      incomingIlpPacket
    } = handlers
    const pipelines: Pipelines = {
      startup: new MiddlewarePipeline<void, void>(),
      incomingData: new MiddlewarePipeline<IlpPrepare, IlpReply>(),
      incomingMoney: new MiddlewarePipeline<string, void>(),
      outgoingData: new MiddlewarePipeline<IlpPrepare, IlpReply>(),
      outgoingMoney: new MiddlewarePipeline<string, void>(),
      shutdown: new MiddlewarePipeline<void, void>()
    }
    for (const middlewareName of Object.keys(this.middlewares)) {
      const middleware = this.middlewares[middlewareName]
      try {
        await middleware.applyToPipelines(pipelines)
      } catch (err) {
        const errInfo = (err && typeof err === 'object' && err.stack) ? err.stack : String(err)

        console.log('failed to apply middleware middlewareName=%s error=%s', middlewareName, errInfo)
        throw new Error('failed to apply middleware. middlewareName=' + middlewareName)
      }
    }

    // Generate startup middleware
    this.startupPipeline = this.createHandler(pipelines.startup, async () => { return })

    // Generate outgoing middleware (ILP prepare from connector to plugin)
    this.outgoingIlpPacketPipeline = this.createHandler(pipelines.outgoingData, outgoingIlpPacket)
    this.outgoingMoneyPipeline = this.createHandler(pipelines.outgoingMoney, outgoingMoney)

    // Generate incoming middleware (ILP Prepare from plugin to connector)
    const incomingIlpPacketPipeline = this.createHandler(pipelines.incomingData, incomingIlpPacket)
    const incomingMoneyPipeline = this.createHandler(pipelines.incomingMoney, incomingMoney)

    // Generate shutdown middleware
    this.shutdownPipeline = this.createHandler(pipelines.shutdown, async () => { return })

    return { incomingIlpPacketPipeline, incomingMoneyPipeline }
  }

  public async sendOutgoingIlpPacket (packet: IlpPrepare): Promise<IlpReply> {
    if (this.outgoingIlpPacketPipeline) return this.outgoingIlpPacketPipeline(packet)
    throw new UnreachableError('Unable to send packet. No plugin bound for outgoing packets.')
  }

  public async sendOutgoingMoney (amount: string): Promise<void> {
    if (this.outgoingMoneyPipeline) return this.outgoingMoneyPipeline(amount)
    throw new UnreachableError('Unable to send money. No plugin bound for outgoing money.')
  }

  private createHandler<T,U> (pipeline: Pipeline<T,U>, next: (param: T) => Promise<U>): (param: T) => Promise<U> {
    const middleware: MiddlewareMethod<T,U> = composeMiddleware(pipeline.getMethods())
    return (param: T) => middleware(param, next)
  }
}

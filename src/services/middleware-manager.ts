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
import { IlpPrepare, Errors } from 'ilp-packet'
import { AccountInfo } from '../types/accounts'
import { AccountService } from '../types/account-service'
import { IlpReply } from '../types/packet'
import Stats from './stats'
const { codes, UnreachableError } = Errors

interface VoidHandler {
  (dummy: void): Promise<void>
}

const BUILTIN_MIDDLEWARES: { [key: string]: MiddlewareDefinition } = {
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
  },
  connector: {
    type: 'connector'
  }
}

export default class MiddlewareManager {

  protected outgoingDataHandler?: (param: IlpPrepare) => Promise<IlpReply>
  protected outgoingMoneyHandler?: MoneyHandler
  protected middlewares: { [key: string]: Middleware }
  protected startupHandler?: VoidHandler
  protected accountInfo: AccountInfo
  protected accountId: string
  protected stats: Stats

  constructor (disabledMiddleWare: string[], accountId: string, accountInfo: AccountInfo, sendIlpPacketToConnector?: (packet: IlpPrepare) => Promise<IlpReply>) {

    const disabledMiddlewareConfig: string[] = disabledMiddleWare || []

    this.middlewares = {}
    this.accountId = accountId
    this.accountInfo = accountInfo
    this.stats = new Stats()

    for (const name of Object.keys(BUILTIN_MIDDLEWARES)) {
      if (disabledMiddlewareConfig[name]) {
        continue
      }

      this.middlewares[name] = this.construct(name, BUILTIN_MIDDLEWARES[name], sendIlpPacketToConnector)
    }
  }

  construct (name: string, definition: MiddlewareDefinition, sendIlpPacketToConnector?: (packet: IlpPrepare) => Promise<IlpReply>): Middleware {
    // Custom middleware
    const Middleware: MiddlewareConstructor =
      loadModuleOfType('middleware', definition.type)

    return new Middleware(definition.options || {}, {
      stats: this.stats,
      getInfo: () => { return { id: this.accountId, info: this.accountInfo } },
      sendIlpPacket: this.sendIlpPacket.bind(this),
      sendMoney: this.sendMoney.bind(this),
      sendIlpPacketToConnector: sendIlpPacketToConnector
    })
  }

  /**
   * Executes middleware hooks for connector startup.
   *
   * This should be called after the plugins are connected
   */
  async startup () {
    const handler = this.startupHandler
    if (handler) await handler(undefined)
  }

  async setupHandlers (accountService: AccountService, plugin: PluginInstance) {
    const pipelines: Pipelines = {
      startup: new MiddlewarePipeline<void, void>(),
      incomingData: new MiddlewarePipeline<IlpPrepare, IlpReply>(),
      incomingMoney: new MiddlewarePipeline<string, void>(),
      outgoingData: new MiddlewarePipeline<IlpPrepare, IlpReply>(),
      outgoingMoney: new MiddlewarePipeline<string, void>()
    }
    for (const middlewareName of Object.keys(this.middlewares)) {
      const middleware = this.middlewares[middlewareName]
      try {
        await middleware.applyToPipelines(pipelines)
      } catch (err) {
        const errInfo = (err && typeof err === 'object' && err.stack) ? err.stack : String(err)

        console.log('failed to apply middleware to account. middlewareName=%s accountId=%s error=%s', middlewareName, errInfo)
        throw new Error('failed to apply middleware. middlewareName=' + middlewareName)
      }
    }

    // Generate outgoing middleware
    const sendOutgoingIlpPacket = async (packet: IlpPrepare) => {
      try {
        return await accountService.sendIlpPacket(packet)
      } catch (e) {
        let err = e
        if (!err || typeof err !== 'object') {
          err = new Error('non-object thrown. value=' + e)
        }

        if (!err.ilpErrorCode) {
          err.ilpErrorCode = codes.F02_UNREACHABLE
        }

        err.message = 'failed to send packet: ' + err.message

        throw err
      }
    }

    const submitMoney = plugin.sendMoney.bind(plugin)
    const startupHandler = this.createHandler(pipelines.startup, async () => { return })
    const outgoingDataHandler: (param: IlpPrepare) => Promise<IlpReply> =
      this.createHandler(pipelines.outgoingData, sendOutgoingIlpPacket)
    const outgoingMoneyHandler: MoneyHandler =
      this.createHandler(pipelines.outgoingMoney, submitMoney)

    this.startupHandler = startupHandler
    this.outgoingDataHandler = outgoingDataHandler
    this.outgoingMoneyHandler = outgoingMoneyHandler

    // Generate incoming middleware
    const handleMoney: MoneyHandler = async () => void 0
    const handleIlpPacket: (param: IlpPrepare) => Promise<IlpReply> =
      (packet: IlpPrepare) => this.sendIlpPacket(packet)
    const incomingDataHandler: (param: IlpPrepare) => Promise<IlpReply> =
      this.createHandler(pipelines.incomingData, handleIlpPacket)
    const incomingMoneyHandler: MoneyHandler =
      this.createHandler(pipelines.incomingMoney, handleMoney)

    accountService.registerIlpPacketHandler(incomingDataHandler)
    plugin.registerMoneyHandler(incomingMoneyHandler)
  }

  removeHandlers () {
    this.startupHandler = undefined
    this.outgoingDataHandler = undefined
  }

  async sendIlpPacket (packet: IlpPrepare): Promise<IlpReply> {
    const handler = this.outgoingDataHandler

    if (!handler) {
      throw new UnreachableError('outgoing data middleware not setup for accountId=' + this.accountId)
    }

    return handler(packet)
  }

  async sendMoney (amount: string): Promise<void> {
    const handler = this.outgoingMoneyHandler

    if (!handler) {
      throw new UnreachableError('there is no outgoing money handler')
    }

    return handler(amount)
  }

  getMiddleware (name: string): Middleware | undefined {
    return this.middlewares[name]
  }

  private createHandler<T,U> (pipeline: Pipeline<T,U>, next: (param: T) => Promise<U>): (param: T) => Promise<U> {
    const middleware: MiddlewareMethod<T,U> = composeMiddleware(pipeline.getMethods())

    return (param: T) => middleware(param, next)
  }
}

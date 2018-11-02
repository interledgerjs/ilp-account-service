import { loadModuleOfType, composeMiddleware } from '../libs/utils'

import {
  Middleware,
  MiddlewareDefinition,
  MiddlewareMethod,
  MiddlewareConstructor,
  Pipeline,
  Pipelines
} from '../types/middleware'
import { DataHandler, MoneyHandler } from '../types/plugin'
import MiddlewarePipeline from '../libs/middleware-pipeline'
import { Errors } from 'ilp-packet'
import { AccountInfo } from '../types/accounts'
const { codes, UnreachableError } = Errors

interface VoidHandler {
  (dummy: void): Promise<void>
}

const BUILTIN_MIDDLEWARES: { [key: string]: MiddlewareDefinition } = {
  balance: {
    type: 'balance'
  }
}

export interface MiddlewareOptions {
  disabledMiddleWare: string[],
  accountInfo: AccountInfo
}

export default class MiddlewareManager {

  public outgoingDataHandler: DataHandler
  public outgoingMoneyHandler: MoneyHandler
  public incomingDataHandler: DataHandler
  public incomingMoneyHandler: MoneyHandler
  protected middlewares: { [key: string]: Middleware }
  private startupHandler: VoidHandler
  private accountInfo: AccountInfo

  constructor (options: MiddlewareOptions) {

    const disabledMiddlewareConfig: string[] = options.disabledMiddleWare || []

    this.middlewares = {}
    this.accountInfo = options.accountInfo

    for (const name of Object.keys(BUILTIN_MIDDLEWARES)) {
      if (disabledMiddlewareConfig[name]) {
        continue
      }

      this.middlewares[name] = this.construct(name, BUILTIN_MIDDLEWARES[name])
    }
  }

  construct (name: string, definition: MiddlewareDefinition): Middleware {
    // Custom middleware
    const Middleware: MiddlewareConstructor =
      loadModuleOfType('middleware', definition.type)

    return new Middleware(definition.options || {}, {
      getInfo: () => this.accountInfo,
      sendData: this.sendData.bind(this),
      sendMoney: this.sendMoney.bind(this)
    })
  }

  async setupHandlers (accountId: string) {
    const pipelines: Pipelines = {
      startup: new MiddlewarePipeline<void, void>(),
      incomingData: new MiddlewarePipeline<Buffer, Buffer>(),
      incomingMoney: new MiddlewarePipeline<string, void>(),
      outgoingData: new MiddlewarePipeline<Buffer, Buffer>(),
      outgoingMoney: new MiddlewarePipeline<string, void>()
    }
    for (const middlewareName of Object.keys(this.middlewares)) {
      const middleware = this.middlewares[middlewareName]
      try {
        await middleware.applyToPipelines(pipelines, accountId)
      } catch (err) {
        const errInfo = (err && typeof err === 'object' && err.stack) ? err.stack : String(err)

        console.log('failed to apply middleware to account. middlewareName=%s accountId=%s error=%s', middlewareName, errInfo)
        throw new Error('failed to apply middleware. middlewareName=' + middlewareName)
      }
    }

    // Generate outgoing middleware
    const submitData = async (data: Buffer) => {
      try {

        return data

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

    //TODO: change submitMoney to be handled through grpc
    const submitMoney = async () => {}
    // const submitMoney = plugin.sendMoney.bind(plugin)

    const startupHandler = this.createHandler(pipelines.startup, async () => { return })
    const outgoingDataHandler: DataHandler =
      this.createHandler(pipelines.outgoingData, submitData)
    const outgoingMoneyHandler: MoneyHandler =
      this.createHandler(pipelines.outgoingMoney, submitMoney)

    this.startupHandler = startupHandler
    this.outgoingDataHandler = outgoingDataHandler
    this.outgoingMoneyHandler = outgoingMoneyHandler

    // Generate incoming middleware
    const handleMoney: MoneyHandler = async () => void 0
    const incomingDataHandler: DataHandler =
      this.createHandler(pipelines.incomingData, async (data: Buffer) => data)
    const incomingMoneyHandler: MoneyHandler =
      this.createHandler(pipelines.incomingMoney, handleMoney)

    this.incomingDataHandler = incomingDataHandler
    this.incomingMoneyHandler = incomingMoneyHandler
  }

  // removePlugin (accountId: string, accountManager: AccountManager) {
  //   accountManager.deregisterDataHandler(accountId)
  //   accountManager.deregisterMoneyHandler(accountId)
  // }

  async sendData (data: Buffer) {
    const handler = this.outgoingDataHandler

    if (!handler) {
      throw new UnreachableError('there is no outgoing data handler')
    }

    return handler(data)
  }

  async sendMoney (amount: string) {
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

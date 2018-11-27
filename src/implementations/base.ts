import { AccountInfo } from '../types/accounts'
import createLogger from 'ilp-logger'
import MiddlewareManager from '../services/middleware-manager'
import { AccountService } from '../types/account-service'
import { MoneyHandler } from '../types/plugin'
import { IlpPrepare, IlpPacketHander, IlpReply, Errors } from 'ilp-packet'
import { EventEmitter } from 'events'
const { UnreachableError } = Errors
const log = createLogger('plugin-account-service')

export class AccountServiceBase extends EventEmitter implements AccountService {

  protected _id: string
  protected _info: AccountInfo
  protected _outgoingIlpPacketHandler?: IlpPacketHander
  protected _outgoingMoneyHandler?: MoneyHandler
  protected _incomingIlpPacketHandler: IlpPacketHander
  protected _incomingMoneyHandler: MoneyHandler
  protected _middlewareManager?: MiddlewareManager
  private _started: boolean = false

  constructor (accountId: string, accountInfo: AccountInfo, middlewares: string[]) {
    super()
    this._id = accountId
    this._info = accountInfo
    if (middlewares.length > 0) {
      this._middlewareManager = new MiddlewareManager(this, middlewares)
    }
    // Default handlers
    this._incomingIlpPacketHandler = async () => {
      throw new UnreachableError('Unable to forward packet. No upstream bound to account.')
    }
    this._incomingMoneyHandler = async () => {
      return
    }
  }

  public get id () {
    return this._id
  }

  public get info () {
    return this._info
  }

  async startup (): Promise<void> {

    if (!this._outgoingIlpPacketHandler) {
      throw new Error('No handler defined for outgoing packets. _outgoingIlpPacketHandler must be set before startup.')
    }

    if (!this._outgoingMoneyHandler) {
      throw new Error('No handler defined for outgoing money. _outgoingMoneyHandler must be set before startup.')
    }

      // This will insert the middleware between the existing handlers
    if (this._middlewareManager) {
      const { incomingIlpPacketPipeline, incomingMoneyPipeline } = await this._middlewareManager.setupHandlers({
        outgoingIlpPacket: this._outgoingIlpPacketHandler,
        outgoingMoney: this._outgoingMoneyHandler,
        incomingIlpPacket: this._incomingIlpPacketHandler,
        incomingMoney: this._incomingMoneyHandler
      })
      this._incomingIlpPacketHandler = incomingIlpPacketPipeline
      this._incomingMoneyHandler = incomingMoneyPipeline
    }

    this._started = true

    await this._startup()

    if (this._middlewareManager) return this._middlewareManager.startup()
  }

  protected async _startup () {
    // Subclasses must override this method with any logic that must be performed before the startup pipeline executes
  }

  async shutdown (): Promise<void> {
    if (this._middlewareManager) await this._middlewareManager.shutdown()
    return this._shutdown()
  }

  protected async _shutdown () {
    // Subclasses must override this method with any logic that must be performed after the shutdown pipeline executes
  }

  async sendIlpPacket (packet: IlpPrepare): Promise<IlpReply> {
    if (this._middlewareManager) {
      return this._middlewareManager.sendOutgoingIlpPacket(packet)
    }
    if (this._outgoingIlpPacketHandler) {
      return this._outgoingIlpPacketHandler(packet)
    }
    throw new Error('No handler defined for outgoing packets. _outgoingIlpPacketHandler must be set before startup.')
  }

  isConnected (): boolean {
    throw new Error('isConnected must be implemented.')
  }

  registerIlpPacketHandler (handler: IlpPacketHander) {
    this._incomingIlpPacketHandler = handler
  }

  deregisterIlpPacketHandler () {
    this._incomingIlpPacketHandler = async () => {
      throw new UnreachableError('Unable to forward packet. No upstream bound to account.')
    }
  }

  registerMoneyHandler (handler: MoneyHandler) {
    this._incomingMoneyHandler = handler
  }

  deregisterMoneyHandler () {
    this._incomingMoneyHandler = async () => { return }
  }

}

import { AccountInfo } from '../types/accounts'
import createLogger from 'ilp-logger'
import { IlpPacketHander } from '../types/packet'
const log = createLogger('plugin-account-service')

export class AccountServiceBase {

  protected _id: string
  protected _info: AccountInfo
  protected _connectHandler?: () => void
  protected _disconnectHandler?: () => void
  protected _ilpPacketHandler?: IlpPacketHander

  constructor (accountId: string, accountInfo: AccountInfo) {
    this._id = accountId
    this._info = accountInfo
  }

  registerConnectHandler (handler: () => void) {
    if (this._connectHandler) {
      log.error('Connect handler already exists for account: ' + this._id)
      throw new Error('Connect handler already exists for account: ' + this._id)
    }
    this._connectHandler = handler
  }

  deregisterConnectHandler () {
    if (this._connectHandler) {
      this._connectHandler = undefined
    }
  }

  registerDisconnectHandler (handler: () => void) {
    if (this._disconnectHandler) {
      log.error('Disconnect handler already exists for account: ' + this._id)
      throw new Error('Disconnect handler already exists for account: ' + this._id)
    }
    this._disconnectHandler = handler
  }

  deregisterDisconnectHandler () {
    if (this._disconnectHandler) {
      this._disconnectHandler = undefined
    }
  }

  registerIlpPacketHandler (handler: IlpPacketHander) {
    if (this._ilpPacketHandler) {
      log.error('ILP packet handler already exists for account: ' + this._id)
      throw new Error('ILP packet handler already exists for account: ' + this._id)
    }
    this._ilpPacketHandler = handler
  }

  deregisterIlpPacketHandler () {
    this._ilpPacketHandler = undefined
  }

  public get id () {
    return this._id
  }

  getInfo () {
    return this._info
  }
}

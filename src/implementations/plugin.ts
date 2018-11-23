import { AccountInfo } from '../types/accounts'
import { PluginInstance } from '../types/plugin'
import { AccountService } from '../types/account-service'
import { AccountServiceBase } from './base'
import { IlpPrepare, serializeIlpPrepare, deserializeIlpPrepare, deserializeIlpPacket } from 'ilp-packet'
import { deserializeIlpReply, IlpReply, serializeIlpReply } from '../types/packet'
import MiddlewareManager from '../services/middleware-manager'
import createLogger from 'ilp-logger'
import { UnreachableError } from 'ilp-packet/dist/src/errors'
const log = createLogger('plugin-account-service')

export default class PluginAccountService extends AccountServiceBase implements AccountService {

  protected _plugin: PluginInstance
  protected _middlewareManager: MiddlewareManager

  constructor (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, disabledMiddleware: string[]) {

    super(accountId, accountInfo)
    this._plugin = plugin
    this._plugin.on('connect', this._pluginConnect.bind(this))
    this._plugin.on('disconnect', this._pluginDisconnect.bind(this))

    this._middlewareManager = new MiddlewareManager(this, disabledMiddleware)
  }

  async startup () {

    const { incomingIlpPacketPipeline, incomingMoneyPipeline } = await this._middlewareManager.setupHandlers({
      outgoingIlpPacket: async (packet) => {
        return deserializeIlpPacket(await this._plugin.sendData(serializeIlpPrepare(packet))).data as IlpReply
      },
      outgoingMoney: async (amount) => {
        return this._plugin.sendMoney(amount)
      },
      incomingIlpPacket: async (packet) => {
        if (this._ilpPacketHandler) return this._ilpPacketHandler(packet)
        throw new UnreachableError('Unable to forward packet. No upstream bound to account.')
      },
      incomingMoney: async () => {
        return
      }
    })
    this._plugin.registerDataHandler(async (data) => {
      return serializeIlpReply(await incomingIlpPacketPipeline(deserializeIlpPrepare(data)))
    })
    this._plugin.registerMoneyHandler(async (amount) => {
      return incomingMoneyPipeline(amount)
    })

    await this._plugin.connect({})
    return this._middlewareManager.startup()
  }

  async shutdown () {
    await this._middlewareManager.shutdown()
    return this._plugin.disconnect()
  }

  isConnected () {
    return this._plugin.isConnected()
  }

  async sendIlpPacket (packet: IlpPrepare) {
    return this._middlewareManager.sendOutgoingIlpPacket(packet)
  }

  protected async _pluginConnect () {
    if (this._connectHandler) return this._connectHandler()
  }

  protected async _pluginDisconnect () {
    if (this._disconnectHandler) return this._disconnectHandler()
  }

  public getPlugin () {
    return this._plugin
  }
}

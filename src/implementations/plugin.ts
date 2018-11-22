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

  protected plugin: PluginInstance
  protected middlewareManager: MiddlewareManager

  constructor (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, disabledMiddleware: string[]) {

    super(accountId, accountInfo)
    this.plugin = plugin
    this.plugin.on('connect', this._pluginConnect.bind(this))
    this.plugin.on('disconnect', this._pluginDisconnect.bind(this))

    this.middlewareManager = new MiddlewareManager(this, disabledMiddleware)
  }

  async startup () {

    const { incomingIlpPacketPipeline, incomingMoneyPipeline } = await this.middlewareManager.setupHandlers({
      outgoingIlpPacket: async (packet) => {
        return deserializeIlpPacket(await this.plugin.sendData(serializeIlpPrepare(packet))).data as IlpReply
      },
      outgoingMoney: async (amount) => {
        return this.plugin.sendMoney(amount)
      },
      incomingIlpPacket: async (packet) => {
        if (this._ilpPacketHandler) return this._ilpPacketHandler(packet)
        throw new UnreachableError('Unable to forward packet. No upstream bound to account.')
      },
      incomingMoney: async () => {
        return
      }
    })
    this.plugin.registerDataHandler(async (data) => {
      return serializeIlpReply(await incomingIlpPacketPipeline(deserializeIlpPrepare(data)))
    })
    this.plugin.registerMoneyHandler(async (amount) => {
      return incomingMoneyPipeline(amount)
    })

    await this.plugin.connect({})
    return this.middlewareManager.startup()
  }

  async shutdown () {
    await this.middlewareManager.shutdown()
    return this.plugin.disconnect()
  }

  isConnected () {
    return this.plugin.isConnected()
  }

  async sendIlpPacket (packet: IlpPrepare) {
    return this.middlewareManager.sendOutgoingIlpPacket(packet)
  }

  protected async _pluginConnect () {
    if (this._connectHandler) return this._connectHandler()
  }

  protected async _pluginDisconnect () {
    if (this._disconnectHandler) return this._disconnectHandler()
  }

}

import { AccountInfo } from '../types/accounts'
import { PluginInstance } from '../types/plugin'
import createLogger from 'ilp-logger'
import { AccountService } from '../types/account-service'
import { serializeIlpPrepare, deserializeIlpPrepare } from 'ilp-packet'
import { deserializeIlpReply, IlpReply, serializeIlpReply } from '../types/packet'
import { createConnection, ErrorPayload, FrameContentType, MessagePayload } from 'ilp-transport-grpc'
import PluginAccountService from './plugin'

const log = createLogger('plugin-account-service')

export interface ConnectorInfo {
  port: number
  address: string
}

export default class GrpcPluginProxyAccountService extends PluginAccountService implements AccountService {

  protected connectorAddress: string
  protected connectorPort: number
  protected client: any

  constructor (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, connectorInfo: ConnectorInfo, disabledMiddleware: string[]) {

    super(accountId, accountInfo, plugin, disabledMiddleware)
    this.connectorAddress = connectorInfo.address
    this.connectorPort = connectorInfo.port
  }

  async startup () {
    this.client = await createConnection(this.connectorAddress + ':' + this.connectorPort,{
      accountId: this._id,
      accountInfo: this._info
    })

    this.client.on('request', (message: MessagePayload, replyCallback: (reply: ErrorPayload | MessagePayload | Promise<ErrorPayload | MessagePayload>) => void) => {
      replyCallback(new Promise(async (respond) => {
        respond({
          protocol: 'ilp',
          contentType: FrameContentType.ApplicationOctetStream,
          payload: serializeIlpReply(await this.sendIlpPacket(deserializeIlpPrepare(message.payload)))
        })
      }))
    })

    this.registerIlpPacketHandler((packet) => {
      return new Promise<IlpReply>(async (resolve) => {
        let response = await this.client.request({
          protocol: 'ilp',
          contentType: 1,
          payload: serializeIlpPrepare(packet)
        })
        resolve(deserializeIlpReply(response.payload))
      })
    })
    return super.startup()
  }

  async shutdown () {
    await super.shutdown()
    // TODO - Correctly dispose gRPC stream
    // return this.client.shutdown()
    return
  }

  isConnected () {
    // TODO Check state of gRPC link too
    // return super.isConnected() && this.client.isConnected()
    return super.isConnected()
  }

  protected async _pluginConnect () {
    if (this._connectHandler) this._connectHandler()
    this._notifyConnectionChange(true)
  }

  protected async _pluginDisconnect () {
    if (this._disconnectHandler) this._disconnectHandler()
    this._notifyConnectionChange(false)
  }

  private _notifyConnectionChange (isConnected: boolean) {
    // TODO: notify connector about connection change
  }

}

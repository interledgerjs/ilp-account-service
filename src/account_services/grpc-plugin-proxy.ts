import { AccountInfo } from '../types/accounts'
import { PluginInstance } from '../types/plugin'
import createLogger from 'ilp-logger'
import { AccountService } from '../types/account-service'
import { AccountServiceBase } from './base'
import { IlpPacket, IlpPrepare, serializeIlpPrepare, deserializeIlpPrepare, serializeIlpFulfill, serializeIlpReject } from 'ilp-packet'
import { deserializeIlpReply, IlpReply, isFulfill, serializeIlpReply } from '../types/packet'
import MiddlewareManager from '../services/middleware-manager'
import { createConnection, ErrorPayload, FrameContentType, MessagePayload } from 'ilp-transport-grpc'

const log = createLogger('plugin-account-service')

export interface ConnectorInfo {
  port: number
  address: string
}

export default class GrpcPluginProxyAccountService extends AccountServiceBase implements AccountService {

  protected plugin: PluginInstance
  protected connectorAddress: string
  protected connectorPort: number
  protected client: any
  protected middlewareManager: MiddlewareManager

  constructor (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, connectorInfo: ConnectorInfo, disabledMiddleware: string[]) {

    super(accountId, accountInfo)
    this.plugin = plugin
    this.plugin.on('connect', this._pluginConnect.bind(this))
    this.plugin.on('disconnect', this._pluginDisconnect.bind(this))
    this.connectorAddress = connectorInfo.address
    this.connectorPort = connectorInfo.port

    this._connectGrpc()
    this._registerConnectorDataHandler()
    this.plugin.on('connect', this._pluginConnect.bind(this))
    this.plugin.on('disconnect', this._pluginDisconnect.bind(this))
    this.middlewareManager = new MiddlewareManager(disabledMiddleware, this.id, this.info, this._call)
    this.middlewareManager.setupHandlers(this, this.plugin)
  }

  async startupMiddleware () {
    await this.middlewareManager.startup()
  }

  async connect () {
    return this.plugin.connect({})
  }

  async disconnect () {
    return this.plugin.disconnect()
  }

  isConnected () {
    return this.plugin.isConnected()
  }

  async sendIlpPacket (packet: IlpPrepare) {
    return deserializeIlpReply(await this.plugin.sendData(serializeIlpPrepare(packet)))
  }

  registerIlpPacketHandler (handler: (data: IlpPrepare) => Promise<IlpReply>) {
    this.plugin.registerDataHandler(async (data: Buffer) => {
      const reply = await handler(deserializeIlpPrepare(data))
      return isFulfill(reply) ? serializeIlpFulfill(reply) : serializeIlpReject(reply)
    })
  }

  deregisterIlpPacketHandler () {
    this.plugin.deregisterDataHandler()
  }

  private _pluginConnect () {
    if (this.connectHandler) this.connectHandler()
    this._notifyConnectionChange(true)
  }

  private _pluginDisconnect () {
    if (this.disconnectHandler) this.disconnectHandler()
    this._notifyConnectionChange(false)
  }

  private _notifyConnectionChange (isConnected: boolean) {
    // TODO: notify connector about connection change
  }

  getInfo () {
    return this.info
  }

  private async _connectGrpc () {
    this.client = await createConnection(this.connectorAddress + ':' + this.connectorPort,{
      accountId: this.id,
      accountInfo: this.info
    })
  }

  private _registerConnectorDataHandler () {
    this.client.on('request', (message: MessagePayload, replyCallback: (reply: ErrorPayload | MessagePayload | Promise<ErrorPayload | MessagePayload>) => void) => {
      replyCallback(new Promise(async (respond) => {
        respond({
          protocol: 'ilp',
          contentType: FrameContentType.ApplicationOctetStream,
          payload: serializeIlpReply(await this.middlewareManager.sendIlpPacket(deserializeIlpPrepare(message.payload)))
        })
      }))
    })
  }

  private async _call (packet: IlpPrepare): Promise<IlpReply> {
    return new Promise<IlpReply>(async (resolve, reject) => {
      let response = await this.client.request({
        protocol: 'ilp',
        contentType: 1,
        payload: serializeIlpPrepare(packet)
      })
      resolve(deserializeIlpReply(response.payload))
    })
  }
}

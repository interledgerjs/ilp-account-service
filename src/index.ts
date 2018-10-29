import * as Debug from 'debug'
import { PluginV2 } from 'ilp-compat-plugin' // Can this type be pulled from somewhere else?
import { AccountInfo } from 'ilp-connector/src/types/accounts'
import IlpGrpc from 'ilp-grpc'

// const IlpPluginBtp: PluginV2 = AbstractBtpPlugin as any
const debug = Debug('ilp-pluginproxy')

export interface ConnectorInfo {
  port: number
  address: string
}

export interface IlpPluginProxyOpts {
  connector: ConnectorInfo
  accountId: string,
  account: AccountInfo
}

export class PluginProxy {

  private _plugin: PluginV2
  private _connectorAddress: string
  private _connectorPort: number
  private _client: any
  private _accountId: string
  private _account: AccountInfo

  constructor (opt: IlpPluginProxyOpts, plugin: PluginV2) {
    this._plugin = plugin
    this._account = opt.account
    this._accountId = opt.accountId
    this._connectorAddress = opt.connector.address
    this._connectorPort = opt.connector.port
  }

  async connect (): Promise<void> {

    // Connect plugin to server
    await this._connectPlugin()

    // Connect gRPC
    await this._connectGrpc()

    this._plugin.on('connect', () => this.handleConnectionChange(true))
    this._plugin.on('disconnect', () => this.handleConnectionChange(false))

    // Setup Incoming Listeners
    this._registerDataHandler()

    // Register the account on the connector
    try {
      await this._client.addAccount({
        id: this._accountId,
        info: this._account
      })
      await this.handleConnectionChange(this._plugin.isConnected())
    } catch (error) {
      console.log(error)
    }
  }

  async _connectPlugin () {
    await this._plugin.connect()
  }

  async _connectGrpc () {
    this._client = new IlpGrpc({
      server: this._connectorAddress + ':' + this._connectorPort,
      accountId: this._accountId,
      dataHandler: this.handleConnectorData.bind(this)
    })

    await this._client.connect()
  }

  _registerDataHandler () {
    this._plugin.registerDataHandler(this.handlePluginData.bind(this))
  }

  async handlePluginData (ilp: Buffer) {
    return this._client.sendData(ilp)
  }

  async handleConnectorData (ilp: Buffer) {
    return this._plugin.sendData(ilp)
  }

  async handleConnectionChange (status: boolean) {
    this._client.updateConnectionStatus(status)
  }

  /**
   * Data handlers to deal with
   *
   * @Incoming (coming into the plugin from external source)
   * *IncomingDataHandler
   * *IncomingMoneyHandler
   * These need to be forwarded on via the gRPC to the connector
   *
   * @Outgoing (coming from the connector to be sent out from plugin)
   * OutgoingDataHandler
   * OutgoingMoneyHandler
   * Methods on gRPC needs to be setup to listen for an incoming stream and forward to connected plugin on receiving
   * messages
   */

}

import { PluginV2 } from 'ilp-compat-plugin' // Can this type be pulled from somewhere else?
import { AccountInfo } from 'ilp-connector/src/types/accounts'
import { BtpError, BtpMessage, BtpMessageContentType, createConnection } from 'ilp-protocol-btp3'
import MiddlewareManager from './services/middleware-manager'

export interface ConnectorInfo {
  port: number
  address: string
}

export interface IlpPluginProxyOpts {
  connector: ConnectorInfo
  accountId: string,
  account: AccountInfo
}
//
// export class PluginProxy {
//
//   private _plugin: PluginV2
//   private _connectorAddress: string
//   private _connectorPort: number
//   private _client: any
//   private _accountId: string
//   private _account: AccountInfo
//   private _middlewareManager: MiddlewareManager
//
//   constructor (opt: IlpPluginProxyOpts, plugin: PluginV2, disabledMiddleWare: string[] = []) {
//     this._plugin = plugin
//     this._account = opt.account
//     this._accountId = opt.accountId
//     this._connectorAddress = opt.connector.address
//     this._connectorPort = opt.connector.port
//     this._middlewareManager = new MiddlewareManager({ disabledMiddleWare: disabledMiddleWare, accountInfo: opt.account })
//   }
//
//   async connect (): Promise<void> {
//     // Setup middleware
//     await this._middlewareManager.setupHandlers(this._accountId)
//
//     // Connect plugin to server
//     await this._connectPlugin()
//
//     // Connect gRPC
//
//     await this._connectGrpc()
//
//     this._plugin.on('connect', () => this.handleConnectionChange(true))
//     this._plugin.on('disconnect', () => this.handleConnectionChange(false))
//
//     // Setup Incoming Listeners
//     this._registerDataHandler()
//     this._registerConnectorDataHandler()
//   }
//
//   async _connectPlugin () {
//     await this._plugin.connect()
//   }
//
//   async _connectGrpc () {
//     this._client = await createConnection(this._connectorAddress + ':' + this._connectorPort,{
//       headers: {
//         authorization: 'Bearer TOKEN'
//       },
//       accountId: 'matt',
//       accountInfo: {
//         relation: 'parent',
//         assetScale: 9,
//         assetCode: 'xrp'
//       }
//     })
//   }
//
//   _registerDataHandler () {
//     this._plugin.registerDataHandler(this.handlePluginData.bind(this))
//   }
//
//   _registerConnectorDataHandler () {
//     this._client.on('request', (message: BtpMessage, replyCallback: (reply: BtpMessage | BtpError | Promise<BtpMessage | BtpError>) => void) => {
//       replyCallback(new Promise(async (respond) => {
//         let ilpAfterOutgoingMiddleware = await this._middlewareManager.outgoingDataHandler(message.payload)
//         respond({
//           protocol: 'ilp',
//           contentType: BtpMessageContentType.ApplicationOctetStream,
//           payload:  await this._plugin.sendData(ilpAfterOutgoingMiddleware)
//         })
//       }))
//     })
//   }
//
//   async handlePluginData (ilp: Buffer) {
//     let ilpAfterIncomingMiddleware = await this._middlewareManager.incomingDataHandler(ilp)
//     return this._call(ilpAfterIncomingMiddleware)
//   }
//
//   async _call (ilp: Buffer): Promise<Buffer> {
//     return new Promise<Buffer>(async (resolve, reject) => {
//       let response = await this._client.request({
//         protocol: 'ilp',
//         contentType: 1,
//         payload: ilp
//       })
//       resolve(response.payload)
//     })
//   }
//
//   async handleConnectionChange (status: boolean) {
//     this._client.updateConnectionStatus(status)
//   }
//
//   /**
//    * Data handlers to deal with
//    *
//    * @Incoming (coming into the plugin from external source)
//    * *IncomingDataHandler
//    * *IncomingMoneyHandler
//    * These need to be forwarded on via the gRPC to the connector
//    *
//    * @Outgoing (coming from the connector to be sent out from plugin)
//    * OutgoingDataHandler
//    * OutgoingMoneyHandler
//    * Methods on gRPC needs to be setup to listen for an incoming stream and forward to connected plugin on receiving
//    * messages
//    */
//
// }

import { AccountInfo } from '../types/accounts'
import { GrpcTransport, MessagePayload, FrameContentType, ErrorPayload } from 'ilp-transport-grpc'
import { IlpReply, deserializeIlpReply, serializeIlpReply, serializeIlpPrepare, deserializeIlpPrepare } from 'ilp-packet'
import { AccountServiceBase } from './base'
import createLogger from 'ilp-logger'
const log = createLogger('grpc-account-service')

export default class GrpcAccountService extends AccountServiceBase {

  protected stream: GrpcTransport
  constructor (accountId: string, accountInfo: AccountInfo, stream: GrpcTransport) {

    super(accountId, accountInfo, [])
    this.stream = stream

    stream.on('request', (message: MessagePayload, replyCallback: (reply: MessagePayload | ErrorPayload | Promise<MessagePayload | ErrorPayload>) => void) => {
      replyCallback(new Promise(async (respond, reject) => {
        respond({
          protocol: 'ilp',
          contentType: FrameContentType.ApplicationOctetStream,
          payload: serializeIlpReply(await this._incomingIlpPacketHandler(deserializeIlpPrepare(message.payload)))
        })
      }))
    })

    // TODO - Bind to correct connect and disconnect events on the stream
    // stream.on('connect', this._streamConnect.bind(this)
    // stream.on('disconnect', this._streamDisconnect.bind(this)

    this._outgoingIlpPacketHandler = (packet) => {
      return new Promise<IlpReply>(async (resolve, reject) => {
        try {
          const response = await this.stream.request({
            protocol: 'ilp',
            contentType: FrameContentType.ApplicationOctetStream,
            payload: serializeIlpPrepare(packet)
          })
          resolve(deserializeIlpReply(response.payload))
        } catch (e) {
          reject(e)
        }
      })
    }

  }

  protected async _startup () {
    // NO-OP - gRPC stream is already connected
  }

  protected async _shutdown () {
    // TODO - Close stream?
  }

  isConnected () {
    return true // TODO - return status from remote plugin and/or current connection (heartbeat?)
  }

  private _streamConnect () {
    if (this._connectHandler) this._connectHandler()
  }

  private _streamDisconnect () {
    if (this._disconnectHandler) this._disconnectHandler()
  }
}

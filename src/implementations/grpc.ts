import { AccountInfo } from '../types/accounts'
import { GrpcTransport, MessagePayload, FrameContentType, ErrorPayload } from 'ilp-transport-grpc'
import { AccountService } from '../types/account-service'
import { deserializeIlpPacket, serializeIlpPacket, IlpPrepare, serializeIlpPrepare, deserializeIlpPrepare } from 'ilp-packet'
import { AccountServiceBase } from './base'
import { IlpReply, deserializeIlpReply, serializeIlpReply, IlpPacketHander } from '../types/packet'
import createLogger from 'ilp-logger'
const log = createLogger('grpc-account-service')

export default class GrpcAccountService extends AccountServiceBase implements AccountService {

  protected stream: GrpcTransport
  constructor (accountId: string, accountInfo: AccountInfo, stream: GrpcTransport) {

    super(accountId, accountInfo)
    this.stream = stream

    stream.on('request', (message: MessagePayload, replyCallback: (reply: MessagePayload | ErrorPayload | Promise<MessagePayload | ErrorPayload>) => void) => {
      replyCallback(new Promise(async (respond, reject) => {
        if (this._ilpPacketHandler) {
          respond({
            protocol: 'ilp',
            contentType: FrameContentType.ApplicationOctetStream,
            payload: serializeIlpReply(await this._ilpPacketHandler(deserializeIlpPrepare(message.payload)))
          })
        } else {
          reject(new Error('No handler registered for incoming data'))
        }
      }))
    })

    // TODO - Bind to correct connect and disconnect events on the stream
    // stream.on('connect', this._streamConnect.bind(this)
    // stream.on('disconnect', this._streamDisconnect.bind(this)

  }

  async startup () {
    // No-op
  }

  async shutdown () {
    // TODO - Close stream
  }

  isConnected () {
    return true // TODO - return status from remote plugin and/or current connection (heartbeat?)
  }

  async sendIlpPacket (packet: IlpPrepare): Promise<IlpReply> {
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

  private _streamConnect () {
    if (this._connectHandler) this._connectHandler()
  }

  private _streamDisconnect () {
    if (this._disconnectHandler) this._disconnectHandler()
  }
}

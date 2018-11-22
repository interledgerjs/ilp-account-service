import { Middleware, MiddlewareCallback, MiddlewareServices, Pipelines } from '../types/middleware'
import { IlpPrepare, Type } from 'ilp-packet'
import { IlpReply } from '../types/packet'
import createLogger from 'ilp-logger'
import { AccountEntry } from '../types/accounts'
const log = createLogger('connector-as-middleware')

export default class ConnectorMiddleware implements Middleware {

  private sendIlpPacketToConnector: (packet: IlpPrepare) => Promise<IlpReply>
  private getInfo: () => AccountEntry

  constructor (opts: {}, { getInfo, sendIlpPacketToConnector }: MiddlewareServices) {
    if (!sendIlpPacketToConnector) {
      log.error('did not specify sendIlpPacketToConnector')
      throw new Error('did not specify sendIlpPacketToConnector')
    }
    this.sendIlpPacketToConnector = sendIlpPacketToConnector
    this.getInfo = getInfo
  }

  async applyToPipelines (pipelines: Pipelines) {
    pipelines.incomingData.insertLast({
      name: 'connector',
      method: async (packet: IlpPrepare, next: MiddlewareCallback<IlpPrepare, IlpReply>) => {
        let reply
        try {
          reply = await this.sendIlpPacketToConnector(packet)
        } catch (err) {
          throw err
        }

        if (reply.type === Type.TYPE_ILP_REJECT) {
          return reply
        }

        return next(reply)
      }
    })
  }
}

import { IlpPrepare, IlpReply, Errors } from 'ilp-packet'
import { Middleware, MiddlewareCallback, Pipelines } from '../types/middleware'
import createLogger from 'ilp-logger'
const log = createLogger('expire-middleware')
const { InternalError } = Errors

export default class ExpireMiddleware implements Middleware {
  async applyToPipelines (pipelines: Pipelines) {
    pipelines.outgoingData.insertLast({
      name: 'expire',
      method: async (packet: IlpPrepare, next: MiddlewareCallback<IlpPrepare, IlpReply>) => {
        const { executionCondition, expiresAt } = packet
        const duration = expiresAt.getTime() - Date.now()
        const promise = next(packet)
        let timeout: NodeJS.Timer
        const timeoutPromise: Promise<IlpReply> = new Promise((resolve, reject) => {
          timeout = setTimeout(() => {
            log.debug('packet expired. cond=%s expiresAt=%s', executionCondition.slice(0, 6).toString('base64'), expiresAt.toISOString())
            reject(new InternalError('packet expired.'))
          }, duration)
        })

        return Promise.race([
          promise.then((reply) => { clearTimeout(timeout); return reply }),
          timeoutPromise
        ])
      }
    })
  }
}

#!/usr/bin/env node

export { AccountInfo, AccountEntry } from './types/accounts'
export { AccountService } from './types/account-service'
export { AccountServiceBase } from './implementations/base'
export {
  AccountServiceProvider,
  AccountServiceProviderServices,
  AccountServiceProviderDefinition } from './types/account-service-provider'
export { default as PluginAccountService } from './implementations/plugin'
export { default as PluginAccountServiceProvider } from './providers/plugin'

import { default as createLogger } from 'ilp-logger'
import { default as createStore } from 'ilp-store'
import { AccountInfo } from './types/accounts'
import createApp from './app'
import { AccountService } from './types/account-service'
const log = createLogger('ilp-account-service')
require('source-map-support').install()

if (!module.parent) {
  const connectorUrl = process.env.CONNECTOR_URL
  const accountId = process.env.ACCOUNT_ID
  const accountInfo = JSON.parse(process.env.ACCOUNT_INFO || '{}') as AccountInfo
  const opts = Object.assign({}, accountInfo.options)
  const pluginModule = accountInfo.plugin ? String(accountInfo.plugin) : 'ilp-plugin-btp'
  const plugin = new (require(pluginModule))(opts, {
    log: createLogger('ilp-account-service[plugin]'),
    store: createStore()
  })

  if (!connectorUrl) {
    throw new Error('CONNECTOR_URL must be provided.')
  }
  if (!accountId) {
    throw new Error('ACCOUNT_ID must be provided.')
  }

  const run = async () => {

    // TODO - Provide a better default. We can build but this won't work
    // const client = await createConnection(connectorUrl, { accountId, accountInfo })
    // const uplink = new GrpcAccountService(accountId, accountInfo, client)

    const uplink = {} as AccountService
    const middlewares = ['error-handler', 'rate-limit', 'throughput', 'balance', 'expire']
    const app = createApp(accountId, accountInfo, plugin, uplink, middlewares)

    await app.startup()

    let shuttingDown = false
    process.on('SIGINT', async () => {
      try {
        if (shuttingDown) {
          log.warn('received second SIGINT during graceful shutdown, exiting forcefully.')
          process.exit(1)
          return
        }
        shuttingDown = true

        // Graceful shutdown
        log.debug('shutting down.')
        await app.shutdown()
        log.debug('completed graceful shutdown.')
        process.exit(0)
      } catch (err) {
        const errInfo = (err && typeof err === 'object' && err.stack) ? err.stack : err
        log.error('error while shutting down. error=%s', errInfo)
        process.exit(1)
      }
    })
  }
  run().catch(e => console.error)
}

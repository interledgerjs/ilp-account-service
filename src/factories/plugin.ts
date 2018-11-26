import { AccountService } from '../types/account-service'
import { AccountServiceFactory, AccountServiceFactoryOptions } from '../types/account-service-factory'
import { AccountInfo } from '../types/accounts'
import { default as createLogger } from 'ilp-logger'
import { default as createStore } from 'ilp-store'
import PluginAccountService from '../implementations/plugin'

export default class PluginAccountServiceFactory implements AccountServiceFactory {

  protected _newAccountHandler?: (accountId: string, accountService: AccountService) => void
  protected accountsConfig: object = {}
  protected middleware: string[] = []

  constructor (opts: AccountServiceFactoryOptions) {
    if (opts.accounts) this.accountsConfig = opts.accounts
    if (opts.middleware) this.middleware = opts.middleware
  }

  create (accountId: string, accountInfo: AccountInfo, middleware: string[]) {
    const Plugin = require(accountInfo.plugin || 'ilp-plugin-btp')
    const plugin = new Plugin(accountInfo.options, {
      log: createLogger('ilp-account-service[plugin]'),
      store: createStore()
    })
    return new PluginAccountService(accountId, accountInfo, plugin, middleware)
  }

  async startup () {
    if (!this._newAccountHandler) throw new Error('there is no new account handler registered')

    for (let accountId of Object.keys(this.accountsConfig)) {
      const service = this.create(accountId, this.accountsConfig[accountId], this.middleware)
      await this._newAccountHandler(accountId, service)
    }
  }

  async shutdown () {
    this._newAccountHandler = undefined
  }

  registerNewAccountHandler (handler: (accountId: string, accountService: AccountService) => void) {
    if (this._newAccountHandler) {
      throw new Error('new account handler already exists')
    }

    this._newAccountHandler = handler
  }
}

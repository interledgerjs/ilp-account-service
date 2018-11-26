import { AccountService } from '../types/account-service'
import { AccountServiceProvider, AccountServiceProviderOptions } from '../types/account-service-provider'
import { AccountInfo } from '../types/accounts'
import { default as createLogger, Logger } from 'ilp-logger'
import { default as createStore, StoreInstance } from 'ilp-store'
import PluginAccountService from '../implementations/plugin'

export default class PluginAccountServiceProvider implements AccountServiceProvider {

  protected _handler?: (accountService: AccountService) => void
  protected _address?: string
  protected _configuredAccounts: Map<string, AccountInfo>
  protected _middleware: string[]
  protected _isStarted: boolean = false
  protected _store: StoreInstance
  protected _log: Logger

  constructor (accounts: Map<string, AccountInfo>, middleware: string[], options: AccountServiceProviderOptions) {
    this._configuredAccounts = accounts
    this._middleware = middleware
    this._log = options.log || createLogger('ilp-account-service'),
    this._store = options.store || createStore()
  }

  private _create (accountId: string, accountInfo: AccountInfo) {
    if (!this._handler) throw new Error('no handler defined')

    const Plugin = require(accountInfo.plugin || 'ilp-plugin-btp')
    const plugin = new Plugin(accountInfo.options, {
      log: this._log, // TODO - Namespace logger
      store: this._store // TODO - Namespace the store
    })
    this._handler(new PluginAccountService(accountId, accountInfo, plugin, this._middleware))
  }

  async startup (handler: (accountService: AccountService) => void) {
    if (this._handler) throw new Error('already started')
    this._handler = handler

    // TODO - Get parent
    for (let accountId of Object.keys(this._configuredAccounts)) {
      this._create(accountId, this._configuredAccounts[accountId])
    }
  }

  async shutdown () {
    this._handler = undefined
  }

  async setAddress (address: string) {
    if (this._address && this._isStarted) throw new Error('can\'t set address again aftyer startup')
  }

}

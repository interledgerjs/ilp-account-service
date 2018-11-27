import { AccountService } from './account-service'
import { Logger } from 'ilp-logger'
import { StoreInstance, CreateStoreOptions } from 'ilp-store'
import { AccountInfo } from './accounts'

export interface AccountServiceProviderConstructor {
  new (options: any, services: AccountServiceProviderServices): AccountServiceProvider
}

export interface AccountServiceProviderServices {
  createLogger: (namespace: string) => {
    info: Function,
    warn: Function,
    error: Function,
    debug: Function,
    trace: Function
  },
  createStore: (namespace: string) => StoreInstance,
  accounts?: { [k: string]: AccountInfo },
}

export interface AccountServiceProviderDefinition {
  type: string
  options?: object
}

export interface AccountServiceProvider {
  startup (handler: (accountService: AccountService) => void): Promise<void>
  shutdown (): Promise<void>
}

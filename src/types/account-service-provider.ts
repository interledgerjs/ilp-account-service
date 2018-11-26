import { AccountService } from './account-service'
import { Logger } from 'ilp-logger'
import { StoreInstance } from 'ilp-store'

export interface AccountServiceProviderOptions {
  log?: Logger,
  store?: StoreInstance,
}

export interface AccountServiceProvider {
  startup (handler: (accountService: AccountService) => void): Promise<void>
  setAddress (address: string): void
  shutdown (): Promise<void>
}

import { AccountService } from './account-service'
import { ConnectorInfo } from '../implementations/grpc-plugin-proxy'
import { AccountInfo } from './accounts'

export interface AccountServiceFactoryOptions {
  accounts?: object,
  connectorInfo?: ConnectorInfo,
  middleware: string[]
}

export interface AccountServiceFactory {
  startup (): void,
  shutdown (): void,
  registerNewAccountHandler (handler: (accountId: string, accountService: AccountService) => void): void,
  create (accountId: string, accountInfo: AccountInfo, middleware: string[]): AccountService
}

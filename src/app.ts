import { AccountInfo } from './types/accounts'
import { PluginInstance } from './types/plugin'
import GrpcPluginProxyAccountService, { ConnectorInfo } from './account_services/grpc-plugin-proxy'
import PluginAccountService from './account_services/plugin'
import { GrpcTransport } from 'ilp-transport-grpc'
import GrpcAccountService from './account_services/grpc'

export function createOutOfProcessPluginAccountService (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, connectorInfo: ConnectorInfo, disabledMiddleware: string[]) {
  return new GrpcPluginProxyAccountService(accountId, accountInfo, plugin, connectorInfo, disabledMiddleware)
}

export function createProxyAccountService (accountId: string, accountInfo: AccountInfo, stream: GrpcTransport) {
  return new GrpcAccountService(accountId, accountInfo, stream)
}

export function createInprocessPluginAccountService (accountId: string, accountInfo: AccountInfo, plugin: PluginInstance, disabledMiddleware: string[]) {
  return new PluginAccountService(accountId, accountInfo, plugin, disabledMiddleware)
}

import PluginAccountService from './implementations/plugin'
import { PluginInstance } from './types/plugin'
import { AccountService } from './types/account-service'
import { AccountInfo } from './types/accounts'
import { default as createLogger } from 'ilp-logger'
const log = createLogger('app')

export default function createApp (
  accountId: string, accountInfo: AccountInfo,
  plugin: PluginInstance, uplink: AccountService, middlewares: string[]) {

  const pluginService = new PluginAccountService(accountId, accountInfo, plugin, middlewares)
  uplink.registerIlpPacketHandler(pluginService.sendIlpPacket.bind(pluginService))
  pluginService.registerIlpPacketHandler(uplink.sendIlpPacket.bind(uplink))
  pluginService.registerMoneyHandler(async (amount: string) => {
    log.info('Handled sendMoney from plugin.')
  })

  return {
    startup: async () => {
      await Promise.all([
        uplink.startup(),
        pluginService.startup()
      ])
    },
    shutdown: async () => {
      await Promise.all([
        uplink.shutdown(),
        pluginService.shutdown()
      ])
    }
  }
}

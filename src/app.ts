#!/usr/bin/env node
import PluginAccountService from './implementations/plugin'
import { PluginInstance } from './types/plugin'
import { AccountInfo } from './types/accounts'
import { IlpPrepare } from 'ilp-packet'
import { IlpPacketHander } from './types/packet'
require('source-map-support').install()

const run = async () => {
  // TODO - Load config
  const accountId = 'adrian'
  const accountInfo = {} as AccountInfo

  // TODO - Create plugin
  const plugin = {} as PluginInstance

  // TODO - Load transport
  const transport = {
    sendIlpPacket: async (packet: IlpPrepare) => {
      return Promise.resolve({ fulfillment: Buffer.alloc(0), data: Buffer.alloc(0) })
    },
    registerIlpPacketHandler: (handler: IlpPacketHander) => {
      return
    }
  }

  const service = new PluginAccountService(accountId, accountInfo, plugin, [])

  // TODO - Bind transport to account service
  service.registerIlpPacketHandler(transport.sendIlpPacket)
  transport.registerIlpPacketHandler(service.sendIlpPacket)

  await service.startup()

  console.log('Running...')
}
run()

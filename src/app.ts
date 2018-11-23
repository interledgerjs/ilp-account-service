#!/usr/bin/env node
import PluginAccountService from './implementations/plugin'
import { PluginInstance } from './types/plugin'
import { AccountInfo } from './types/accounts'
import { serializeIlpReply, IlpReply, deserializeIlpReply, deserializeIlpPrepare, serializeIlpPrepare } from 'ilp-packet'
import { createConnection, MessagePayload, ErrorPayload, FrameContentType } from 'ilp-transport-grpc'
require('source-map-support').install()

const run = async () => {
  // TODO - Load config
  const connectorAddress = ''
  const connectorPort = 0
  const accountId = 'adrian'
  const accountInfo = {} as AccountInfo

  // TODO - Create plugin
  const plugin = {} as PluginInstance

  // TODO - Load transport
  const client = await createConnection(connectorAddress + ':' + connectorPort,{
    accountId,
    accountInfo
  })
  const service = new PluginAccountService(accountId, accountInfo, plugin, [])

  client.on('request', (message: MessagePayload, replyCallback: (reply: ErrorPayload | MessagePayload | Promise<ErrorPayload | MessagePayload>) => void) => {
    replyCallback(new Promise(async (respond) => {
      respond({
        protocol: 'ilp',
        contentType: FrameContentType.ApplicationOctetStream,
        payload: serializeIlpReply(await service.sendIlpPacket(deserializeIlpPrepare(message.payload)))
      })
    }))
  })

  service.registerIlpPacketHandler((packet) => {
    return new Promise<IlpReply>(async (resolve) => {
      let response = await client.request({
        protocol: 'ilp',
        contentType: 1,
        payload: serializeIlpPrepare(packet)
      })
      resolve(deserializeIlpReply(response.payload))
    })
  })

  await service.startup()

  console.log('Running...')
}
run()

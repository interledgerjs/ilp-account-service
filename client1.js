const BtpPlugin = require('ilp-plugin-btp')
const IlpPacket = require('ilp-packet')
const PluginProxy = require('.').PluginProxy
const CONNECTOR_URL = '0.0.0.0'

const pluginServer = new BtpPlugin({
  listener: {
    port: 9000,
    secret: 'secret'
  }
})

pluginServer.registerDataHandler((data => IlpPacket.serializeIlpFulfill({
    fulfillment: Buffer.from('HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok', 'base64'),
    data: Buffer.from('thank you')
})))

const newAccountData = {
    id: "will",
    info: {
        relation: 'child',
        assetScale: 6,
        assetCode: 'XRP',
        plugin: 'ilp-plugin-btp',
        balance: {maximum: '10', minimum: '0'},
        options: {
            info: {
                prefix: 'test.quickstart.' + "will"
            },
            account: 'test.quickstart.' + "will" + '.connector',
            balance: '0'
        }
    },
}

async function run () {

  const plugin = new BtpPlugin({
    server: 'btp+ws://:secret@localhost:9000'
  })

  const proxy = new PluginProxy({
    connector: {
      address: CONNECTOR_URL,
      port: 5505
    },
    accountId: newAccountData.id,
    account: newAccountData.info
  }, plugin)


  //Connecting server and proxy
  await Promise.all([
    pluginServer.connect(),
    proxy.connect()
  ])


  // const response = await pluginServer.sendData(IlpPacket.serializeIlpPrepare({
  //   amount: '10',
  //   expiresAt: new Date(),
  //   executionCondition: Buffer.alloc(32),
  //   destination: 'peer.example',
  //   data: Buffer.from('hello world')
  // }))


  // process.exit(0)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

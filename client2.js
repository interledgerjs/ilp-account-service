const MiddlewareManager = require("./src/services/middleware-manager").default;
const BtpPlugin = require('ilp-plugin-btp')
const IlpPacket = require('ilp-packet')
const PluginProxy = require('.').PluginProxy
const CONNECTOR_URL = '0.0.0.0'

const pluginServer = new BtpPlugin({
  listener: {
    port: 9001,
    secret: 'secret'
  }
})

pluginServer.registerDataHandler((data => console.log('on server', data)))

const newAccountData = {
  id: "matt",
  info: {
    relation: 'child',
    assetScale: 6,
    assetCode: 'XRP',
    plugin: 'ilp-plugin-btp',
    balance: {maximum: '9', minimum: '0'},
    options: {
      info: {
        prefix: 'test.quickstart.' + "matt"
      },
      account: 'test.quickstart.' + "matt" + '.connector',
      balance: '0'
    }
  },
}

async function run() {

  const plugin = new BtpPlugin({
    server: 'btp+ws://:secret@localhost:9001'
  })


  const middlewareManager = new MiddlewareManager({disabledMiddleWare: [], accountInfo: newAccountData.info})
  await middlewareManager.setupHandlers(newAccountData.id)

  const proxy = new PluginProxy({
    connector: {
      address: CONNECTOR_URL,
      port: 5505
    },
    accountId: newAccountData.id,
    account: newAccountData.info
  }, plugin, middlewareManager)


  //Connecting server and proxy
  await Promise.all([
    pluginServer.connect(),
    proxy.connect()
  ])


  try {

    const response = await pluginServer.sendData(IlpPacket.serializeIlpPrepare({
      amount: '5',
      expiresAt: new Date((new Date()).getTime() + 3000),
      executionCondition: Buffer.from('uzoYx3K6u+Nt6kZjbN6KmH0yARfhkj9e17eQfpSeB7U=', 'base64'),
      destination: 'test.quickstart.' + "will",
      data: Buffer.from('hello world')
    }))

    console.log(IlpPacket.deserializeIlpPacket(response))
  }
  catch (e) {
    console.log("failed to send data", e)
  }

  try {

    const response = await pluginServer.sendData(IlpPacket.serializeIlpPrepare({
      amount: '10',
      expiresAt: new Date((new Date()).getTime() + 3000),
      executionCondition: Buffer.from('uzoYx3K6u+Nt6kZjbN6KmH0yARfhkj9e17eQfpSeB7U=', 'base64'),
      destination: 'test.quickstart.' + "will",
      data: Buffer.from('hello world')
    }))

    console.log(IlpPacket.deserializeIlpPacket(response))
  }
  catch (e) {
    console.log("failed to send data", e)
  }


  // process.exit(0)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

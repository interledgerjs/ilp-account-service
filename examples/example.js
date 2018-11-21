const BtpPlugin = require('ilp-plugin-btp')
const IlpPacket = require('ilp-packet')
const PluginProxy = require('.').PluginProxy
const IlpGrpc = require('ilp-protocol-btp3')
const CONNECTOR_URL = '127.0.0.1'
var globStream = null;
const pluginServer = new BtpPlugin({
  listener: {
    port: 9000,
    secret: 'secret'
  }
})

const grpcServer = new IlpGrpc.BtpServer({}, {
  log: console,
})


grpcServer.on('listening', () => {
  console.log('Listening...')
})

grpcServer.on('connection', (stream) => {

  const { accountId, accountInfo } = stream

  console.log(`CONNECTION: state=${stream.state}`)

  stream.on('message', (message) => {
    // console.log(`MESSAGE (protocol=${message.protocol}): ${message.payload.toString()}`)
  })

  globStream = stream

  stream.on('request', (message, replyCallback) => {
    // console.log(`REQUEST (protocol=${message.protocol}): ${message.payload.toString()}`)
    replyCallback(new Promise((respond) => {
      setTimeout(() => {
        respond({
          protocol: 'ilp',
          contentType: 1,
          payload: IlpPacket.serializeIlpFulfill({
            fulfillment: Buffer.alloc(32),
            data: Buffer.from('welcome')
          })
        })
      }, 0)
    }))
  })


  grpcServer.on('error', (error) => console.log(error))

  grpcServer.on('cancelled', (error) => console.log('cancelled', error))

})




pluginServer.registerDataHandler((data => IlpPacket.serializeIlpFulfill({
  fulfillment: Buffer.alloc(32),
  data: Buffer.from('welcome')
})))


async function run () {

  grpcServer.listen({
    host: '0.0.0.0',
    port: 5001
  })

  const plugin = new BtpPlugin({
    server: 'btp+ws://:secret@localhost:9000'
  })


  const proxy = new PluginProxy({
    connector: {
      address: CONNECTOR_URL,
      port: 5001
    },
    accountId: 'matt',
    account: {
      relation: 'peer',
      assetCode: 'xrp',
      assetScale: 9,
      plugin: ''
    }
  }, plugin)


  //Connecting server and proxy
  await Promise.all([
    pluginServer.connect(),
    proxy.connect()
  ])


  const response = await pluginServer.sendData(IlpPacket.serializeIlpPrepare({
    amount: '10',
    expiresAt: new Date(),
    executionCondition: Buffer.alloc(32),
    destination: 'peer.example',
    data: Buffer.from('hello world')
  }))

  console.log(IlpPacket.deserializeIlpPacket(response))


  const response2 = await globStream.request({
    protocol: 'ilp',
    contentType: 0,
    payload: Buffer.from('Hello?')
  })

  console.log('response2', IlpPacket.deserializeIlpPacket(response2.payload))
  // await server.sendMoney(10)
  // await client.sendMoney(10)
  // console.log('sent money (no-op)', response)



  // await client.disconnect()
  // await server.disconnect()
  // process.exit(0)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

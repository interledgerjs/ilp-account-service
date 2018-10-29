const BtpPlugin = require('ilp-plugin-btp')
const IlpPacket = require('ilp-packet')
const PluginProxy = require('.').PluginProxy
const IlpGrpc = require('ilp-grpc').default
const CONNECTOR_URL = '127.0.0.1'

const server = new BtpPlugin({
  listener: {
    port: 9000,
    secret: 'secret'
  }
})

server.registerDataHandler((data => console.log('on server', data)))

const grpcServer = new IlpGrpc({
  listener: {
    port: '1260'
  },
  dataHandler: (data) => console.log('on grpc', data)
})


async function run () {

  await grpcServer.connect()

  const plugin = new BtpPlugin({
    server: 'btp+ws://:secret@localhost:9000'
  })


  const proxy = new PluginProxy({
    connector: {
      address: CONNECTOR_URL,
      port: 1260,
      account: 'test'
    }
  }, plugin)


  //Connecting server and proxy
  await Promise.all([
    server.connect(),
    proxy.connect()
  ])


  const response = await server.sendData(IlpPacket.serializeIlpPrepare({
    amount: '10',
    expiresAt: new Date(),
    executionCondition: Buffer.alloc(32),
    destination: 'peer.example',
    data: Buffer.from('hello world')
  }))

  await grpcServer.sendData(IlpPacket.serializeIlpPrepare({
    amount: '10',
    expiresAt: new Date(),
    executionCondition: Buffer.alloc(32),
    destination: 'peer.example',
    data: Buffer.from('hello world')
  }),'matt')

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

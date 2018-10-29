import 'mocha'
import * as sinon from 'sinon'
import { assert } from 'chai'
import { PluginProxy } from '../src/index'
import MockPlugin from './mocks/plugin'
import IlpGrpc from 'ilp-grpc'
describe('Exports', function () {

  beforeEach(async function () {
    this.grpcServer = new IlpGrpc({
      listener: {
        port: 1260,
        secret: 'test'
      },
      dataHandler: (data: any) => console.log('on grpc', data)
    })
  })

  it('calling connect on the proxy establishes connection on the plugin', function () {

    const plugin = new MockPlugin(1)
    const pluginSpy = sinon.spy(plugin, 'connect')
    const proxy = new PluginProxy({
      connector: {
        address: '127.0.0.1',
        port: 1234
      },
      accountId: 'test',
      account: {
        relation: 'peer',
        plugin: '1',
        assetCode: 'xrp',
        assetScale: 2
      }
    }, plugin)

    proxy.connect().then(value => {
      assert(pluginSpy.calledOnce)
    })
  })

})

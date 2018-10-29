import 'mocha'
import * as sinon from 'sinon'
import { assert } from 'chai'
import { PluginProxy } from '../src/index'
import MockPlugin from './mocks/plugin'
const serverHelper = require('./helpers/server')
describe('Exports', function () {

  beforeEach(async function () {
    this.gRPCServer = serverHelper.create()
  })

  it('calling connect on the proxy establishes connection on the plugin', function () {

    const plugin = new MockPlugin(1)
    const pluginSpy = sinon.spy(plugin, 'connect')
    const proxy = new PluginProxy({
      connector: {
        address: '127.0.0.1',
        port: 1234
      },
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

  it('calling connect on the proxy calls establishes connection with defined connector', function () {

    const plugin = new MockPlugin(1)
    const pluginSpy = sinon.spy(plugin, 'connect')
    const proxy = new PluginProxy({
      connector: {
        address: '127.0.0.1',
        port: 1234
      },
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

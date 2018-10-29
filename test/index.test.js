"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const sinon = require("sinon");
const chai_1 = require("chai");
const index_1 = require("../src/index");
const plugin_1 = require("./mocks/plugin");
const serverHelper = require('./helpers/server');
describe('Exports', function () {
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.gRPCServer = serverHelper.create();
        });
    });
    it('calling connect on the proxy establishes connection on the plugin', function () {
        const plugin = new plugin_1.default(1);
        const pluginSpy = sinon.spy(plugin, 'connect');
        const proxy = new index_1.PluginProxy({
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
        }, plugin);
        proxy.connect().then(value => {
            chai_1.assert(pluginSpy.calledOnce);
        });
    });
    it('calling connect on the proxy calls establishes connection with defined connector', function () {
        const plugin = new plugin_1.default(1);
        const pluginSpy = sinon.spy(plugin, 'connect');
        const proxy = new index_1.PluginProxy({
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
        }, plugin);
        proxy.connect().then(value => {
            chai_1.assert(pluginSpy.calledOnce);
        });
    });
});
//# sourceMappingURL=index.test.js.map
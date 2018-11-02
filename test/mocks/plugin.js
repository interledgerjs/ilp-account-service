"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const IlpPacket = require("ilp-packet");
const bignumber_js_1 = require("bignumber.js");
const ILDCP = require("ilp-protocol-ildcp");
class MockPlugin extends events_1.EventEmitter {
    constructor(exchangeRate) {
        super();
        this.dataHandler = this.defaultDataHandler;
        this.moneyHandler = this.defaultMoneyHandler;
        this.exchangeRate = exchangeRate;
    }
    async connect() {
        this.connected = true;
        return Promise.resolve();
    }
    async disconnect() {
        this.connected = false;
        return Promise.resolve();
    }
    isConnected() {
        return this.connected;
    }
    async sendData(data) {
        if (data[0] === IlpPacket.Type.TYPE_ILP_PREPARE) {
            const parsed = IlpPacket.deserializeIlpPrepare(data);
            if (parsed.destination === 'peer.config') {
                return ILDCP.serializeIldcpResponse({
                    clientAddress: 'test.receiver',
                    assetScale: 9,
                    assetCode: 'ABC'
                });
            }
            const newPacket = IlpPacket.serializeIlpPrepare(Object.assign({}, parsed, { amount: new bignumber_js_1.default(parsed.amount).times(this.exchangeRate).toString(10) }));
            return this.dataHandler(newPacket);
        }
        else {
            return this.dataHandler(data);
        }
    }
    async sendMoney(amount) {
        return this.moneyHandler(amount);
    }
    registerDataHandler(handler) {
        this.dataHandler = handler;
    }
    deregisterDataHandler() {
        this.dataHandler = this.defaultDataHandler;
    }
    registerMoneyHandler(handler) {
        this.moneyHandler = handler;
    }
    deregisterMoneyHandler() {
        this.moneyHandler = this.defaultMoneyHandler;
    }
    async defaultDataHandler(data) {
        return IlpPacket.serializeIlpReject({
            code: 'F02',
            triggeredBy: 'example.mock-plugin',
            message: 'No data handler registered',
            data: Buffer.alloc(0)
        });
    }
    async defaultMoneyHandler(amount) {
        return;
    }
}
MockPlugin.version = 2;
exports.default = MockPlugin;
//# sourceMappingURL=plugin.js.map
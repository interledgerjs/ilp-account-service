import * as Prometheus from 'prom-client'
import { AccountEntry } from '../types/accounts'

function mergeAccountLabels (account: AccountEntry, labels: Prometheus.labelValues): Prometheus.labelValues {
  labels['account'] = account.id
  labels['asset'] = account.info.assetCode
  labels['scale'] = account.info.assetScale
  return labels
}

export class AccountCounter extends Prometheus.Counter {
  constructor (configuration: Prometheus.CounterConfiguration) {
    configuration.labelNames = (configuration.labelNames || [])
    configuration.labelNames.push('account', 'asset', 'scale')
    super(configuration)
  }

  increment (account: AccountEntry, labels: Prometheus.labelValues, value?: number) {
    return this.inc(mergeAccountLabels(account, labels), value)
  }
}

export class AccountGuage extends Prometheus.Gauge {
  constructor (configuration: Prometheus.GaugeConfiguration) {
    configuration.labelNames = (configuration.labelNames || [])
    configuration.labelNames.push('account', 'asset', 'scale')
    super(configuration)
  }

  setValue (account: AccountEntry, labels: Prometheus.labelValues, value: number) {
    return this.set(mergeAccountLabels(account, labels), value)
  }
}

export default class Stats {

  // identifier prefix for logging stats
  private identifier: string
  public incomingDataPackets: AccountCounter
  public incomingDataPacketValue: AccountCounter
  public outgoingDataPackets: AccountCounter
  public outgoingDataPacketValue: AccountCounter
  public incomingMoney: AccountGuage
  public outgoingMoney: AccountGuage
  public rateLimitedPackets: AccountCounter
  public rateLimitedMoney: AccountCounter
  public balance: AccountGuage

  constructor (identifier: string) {
    this.identifier = identifier

    this.incomingDataPackets = new AccountCounter({
      name: this.generateName('_incoming_ilp_packets'),
      help: 'Total number of incoming ILP packets',
      labelNames: ['result', 'code', 'triggeredBy']
    })

    this.incomingDataPacketValue = new AccountCounter({
      name: this.generateName('_incoming_ilp_packet_value'),
      help: 'Total value of incoming ILP packets',
      labelNames: ['result', 'code', 'triggeredBy']
    })

    this.outgoingDataPackets = new AccountCounter({
      name: this.generateName('_outgoing_ilp_packets'),
      help: 'Total number of outgoing ILP packets',
      labelNames: ['result', 'code', 'triggeredBy']
    })

    this.outgoingDataPacketValue = new AccountCounter({
      name: this.generateName('_outgoing_ilp_packet_value'),
      help: 'Total value of outgoing ILP packets',
      labelNames: ['result', 'code', 'triggeredBy']
    })

    this.incomingMoney = new AccountGuage({
      name: this.generateName('_incoming_money'),
      help: 'Total of incoming money',
      labelNames: ['result']
    })

    this.outgoingMoney = new AccountGuage({
      name: this.generateName('_outgoing_money'),
      help: 'Total of outgoing money',
      labelNames: ['result']
    })

    this.rateLimitedPackets = new AccountCounter({
      name: this.generateName('_rate_limited_ilp_packets'),
      help: 'Total of rate limited ILP packets'
    })

    this.rateLimitedMoney = new AccountCounter({
      name: this.generateName('_rate_limited_money'),
      help: 'Total of rate limited money requests'
    })

    this.balance = new AccountGuage({
      name: this.generateName('_balance'),
      help: 'Balances on peer account'
    })
  }

  private generateName (statName: string) {
    return (this.identifier + statName).replace(/-/g,'_').replace(/\./g, '_')
  }

  getStatus () {
    return Prometheus.register.getMetricsAsJSON()
  }
}

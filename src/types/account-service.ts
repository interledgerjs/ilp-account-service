import { AccountInfo } from './accounts'
import { IlpPrepare } from 'ilp-packet'
import { IlpReply, IlpPacketHander } from './packet'

export interface AccountService {
  readonly id: string,
  getInfo (): AccountInfo,
  startup (): Promise<void>,
  shutdown (): Promise<void>,
  registerConnectHandler (handler: () => void): void,
  deregisterConnectHandler (): void,
  registerDisconnectHandler (handler: () => void): void,
  deregisterDisconnectHandler (): void,

  /**
   * Register a handler for ILP prepare packets coming from the account entity
   * @param handler An ILP Prepare packet handler
   */
  registerIlpPacketHandler (handler: IlpPacketHander): void,
  /**
   * Remove the currently registered handler
   */
  deregisterIlpPacketHandler (): void,
  /**
   * Send an ILP prepare to the account entity
   * @param packet An ILP prepare packet
   */
  sendIlpPacket (packet: IlpPrepare): Promise<IlpReply>,
  /**
   * Is the account entity connected
   */
  isConnected (): boolean,
}

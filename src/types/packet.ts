import { IlpPrepare, IlpFulfill, IlpRejection, deserializeIlpPacket, serializeIlpFulfill, serializeIlpReject } from 'ilp-packet'

export type AnyIlpPacket = IlpPrepare | IlpFulfill | IlpRejection

export type IlpReply = IlpFulfill | IlpRejection

export function deserializeIlpReply (data: Buffer): IlpReply {
  return deserializeIlpPacket(data).data as IlpReply
}

export function serializeIlpReply (packet: IlpReply): Buffer {
  return isFulfill(packet) ? serializeIlpFulfill(packet) : serializeIlpReject(packet)
}

export function isFulfill (packet: IlpReply): packet is IlpFulfill {
  return typeof packet['fulfillment'] !== 'undefined'
}

export interface AccountInfo {
  relation: 'parent' | 'peer' | 'child',
  assetCode: string,
  assetScale: number,
  plugin?: string | { [k: string]: any },
  balance?: {
    minimum?: string,
    maximum: string,
    settleThreshold?: string,
    settleTo?: string
  },
  maxPacketAmount?: string,
  throughput?: {
    refillPeriod?: number,
    incomingAmount?: string,
    outgoingAmount?: string
  },
  rateLimit?: {
    refillPeriod?: number,
    refillCount?: number,
    capacity?: number
  },
  options?: object,
  sendRoutes?: boolean,
  receiveRoutes?: boolean,
  ilpAddressSegment?: string
}

export interface AccountEntry {
  id: string,
  info: AccountInfo
}

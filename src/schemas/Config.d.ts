export declare class Config {
    env?: "production" | "test";
    ilpAddress?: string;
    ilpAddressInheritFrom?: string;
    accounts: {
        [k: string]: {
            relation: "parent" | "peer" | "child";
            plugin: string;
            assetCode: string;
            assetScale: number;
            balance?: {
                minimum?: string;
                maximum: string;
                settleThreshold?: string;
                settleTo?: string;
            };
            maxPacketAmount?: string;
            throughput?: {
                refillPeriod?: number;
                incomingAmount?: string;
                outgoingAmount?: string;
            };
            rateLimit?: {
                refillPeriod?: number;
                refillCount?: number;
                capacity?: number;
            };
            sendRoutes?: boolean;
            receiveRoutes?: boolean;
            options?: {
                [k: string]: any;
            };
            ilpAddressSegment?: string;
        };
    };
    defaultRoute?: string;
    routes?: {
        targetPrefix: string;
        peerId: string;
    }[];
    spread?: number;
    minMessageWindow?: number;
    maxHoldTime?: number;
    routeBroadcastEnabled?: boolean;
    routeBroadcastInterval?: number;
    routeCleanupInterval?: number;
    routeExpiry?: number;
    routingSecret?: string;
    backend?: string;
    backendConfig?: {
        [k: string]: any;
    };
    store?: string;
    storePath?: string;
    storeConfig?: {
        [k: string]: any;
    };
    middlewares?: {
        [k: string]: {
            type: string;
            options?: {
                [k: string]: any;
            };
            [k: string]: any;
        };
    };
    disableMiddleware?: ("errorHandler" | "rateLimit" | "balance" | "maxPacketAmount" | "throughput" | "deduplicate" | "validateFulfillment" | "expire" | "stats" | "alert")[];
    reflectPayments?: boolean;
    initialConnectTimeout?: number;
    adminApi?: boolean;
    adminApiPort?: number;
    adminApiHost?: string;
    grpcServerPort?: number;
    grpcServerHost?: string;
    collectDefaultMetrics?: boolean;
}

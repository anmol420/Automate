import { Redis } from "ioredis";

/**
 *  A class in order to setup redis connectivity, alternatively you can also use ioredis package for the redis related usage in the other functions of this package.
 */
class RedisConnection {
    private redisClient: Redis | null = null;

    /**
     *  Connects to Redis with a given url
     *  @param url - Redis Connection String (e.g., redis://localhost:6379)
     *  @returns Redis - Redis Connection Instance 
     */
    connectRedis(url: string): Redis {
        if (this.redisClient) {
            console.warn("Redis Connected Already!");
            return this.redisClient;
        }
        this.redisClient = new Redis(url);
        this.redisClient.on("connect", () => {
            console.log("Redis Connected Succesfully.");
        });
        this.redisClient.on("error", (err) => {
            console.log("Redis Error -", err);
        })
        return this.redisClient;
    };

    /**
     *  Gets Current Active Instance
     *  @throws {Error} - If No Redis Connection has been Established
     *  @returns Redis - Redis Connection Instance
     */
    getRedis(): Redis {
        if (!this.redisClient) {
            throw new Error("Redis Not Connected. Use `connectRedis` method for connection.");
        }
        return this.redisClient;
    };

    /**
     *  Disconnect Redis Server
     * @returns Promise<void> - Resolves When Connection Is Closed
     */
    async disconnectRedis(): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.quit();
            console.log("Redis Connection Closed.");
            this.redisClient = null;
        }
    };
}

export {
    RedisConnection
};
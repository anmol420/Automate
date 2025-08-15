import { Redis } from "ioredis";

let redisClient: Redis | null = null;

/**
 *  Connects to Redis with a given url
 *  @param url - Redis Connection String (e.g., redis://localhost:6379)
 *  @returns {Redis} - Redis Connection Instance 
 */
const connectRedis = (url: string): Redis => {
    if (redisClient) {
        console.warn("Redis Connected Already!");
        return redisClient;
    }
    redisClient = new Redis(url);
    redisClient.on("connect", () => {
        console.log("Redis Connected Succesfully.");
    });
    redisClient.on("error", (err) => {
        console.log("Redis Error -", err);
    })
    return redisClient;
};

/**
 *  Gets Current Active Instance
 *  @throws {Error} - If No Redis Connection has been Established
 *  @returns {Redis} - Redis Connection Instance
 */
const getRedis = (): Redis => {
    if (!redisClient) {
        throw new Error("Redis Not Connected. Use `connectRedis` method for connection.");
    }
    return redisClient;
};

/**
 *  Disconnect Redis Server
 * @returns {Promise<void>} - Resolves When Connection Is Closed
 */
const disconnectRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        console.log("Redis Connection Closed.");
        redisClient = null;
    }
};

export {
    connectRedis,
    getRedis,
    disconnectRedis,
};
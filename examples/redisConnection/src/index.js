import redisConn from "./connections.js";

(async() => {
    try {
        redisConn.connectRedis("redis://localhost:6379");

        // get redis connection
        const redis = redisConn.getRedis();

        // setting value in redis
        await redis.set("hello", "buddy");
        console.log("Redis Value Set");

        // getting value stored in redis
        const value = await redis.get("hello");
        console.log("Value -", value);

        // disconnect redis
        await redisConn.disconnectRedis();
    } catch (error) {
        console.log("Error:", error);
    }
})();
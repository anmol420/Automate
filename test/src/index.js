import { redisConnect } from "./connections.js";

import connection from "./redisCon/redisConnect.js";

(async () => {
    try {
        connection();

        // get redis connection
        const redis = redisConnect.getRedis();

        // setting value in redis
        await redis.set("hello", "buddy");
        console.log("Redis Value Set");

        // getting value stored in redis
        const value = await redis.get("hello");
        console.log("Value -", value);

        // disconnect redis
        await redisConnect.disconnectRedis();
    } catch (error) {
        console.log("Error:", error);
    }
})();
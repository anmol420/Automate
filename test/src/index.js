import { getRedis, disconnectRedis } from "automate";

import connection from "./redisCon/redisConnect.js";

(async () => {
    try {
        connection();

        // get redis connection
        const redis = getRedis();

        // setting value in redis
        await redis.set("hello", "buddy");
        console.log("Redis Value Set");

        // getting value stored in redis
        const value = await redis.get("hello");
        console.log("Value -", value);

        // disconnect redis
        await disconnectRedis();
    } catch (error) {
        console.log("Error:", error);
    }
})();
import { RedisConnection } from "@anmol420/automate";

const redisConnect = new RedisConnection();

const connection = () => redisConnect.connectRedis("redis://localhost:6379");

const redis = async () => {
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
};

export {
    redis
};
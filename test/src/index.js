import { redis } from "./redisConnection.js";

redis()
    .catch((e) => console.log(e));
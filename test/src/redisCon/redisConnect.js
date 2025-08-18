import { redisConnect } from "../connections.js";

// redis running on docker
const connection = () => redisConnect.connectRedis("redis://localhost:6379");

export default connection;
import { connectRedis } from "cron-automate";

// redis running on docker
const connection = () => connectRedis("redis://localhost:6379");

export default connection;
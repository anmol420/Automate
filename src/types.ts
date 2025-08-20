import { Redis } from "ioredis";

export interface Job {
    /** ID for the task to be performed. */
    id: string,
    /** Timestamp when the task should run(in ms). */
    timestamp: number,
    /** Payload for the handler, in order to perform the required task. */
    data: any
}

export type JobHandler = (data: any) => Promise<void> | void;

export interface SchedulerOptions {
    /** Redis client for the connection. */
    redisClient: Redis;
    /** Polling rate for due jobs(in ms). Default: 1000 */
    pollingRate?: number;
    /** Max number of retries on failiure. Default: 3 */
    maxRetries?: number;
    /** Backoff between retries(in ms). Default: 6000 */
    retryBackOf?: number;
    /** Lock duration for the execution of particular job(in ms). Default: 10000 */
    lockMs?: number;
    /** Redis keys namespace prefix. Default: `rosl:` */
    keyPrefix?: string;
}

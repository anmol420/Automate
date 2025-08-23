import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";
import type { Job, JobHandler, SchedulerOptions } from "../types.js";

/**
 *  OneOff Scheduler
 *  - `schedule` - Stores jobs in a Redis ZSET scored by timestamp.
 */
class OneOffScheduler {
    private redis: Redis;
    private handler: JobHandler;
    private pollInterval: NodeJS.Timeout | null = null;

    private readonly POLLING_RATE: number;
    private readonly MAX_RETRIES: number;
    private readonly RETRY_BACKOFF: number;
    private readonly LOCK_MS: number;
    private readonly KEY_PREFIX: (suffix: string) => string;

    constructor(options: SchedulerOptions, handler: JobHandler) {
        this.redis = options.redisClient;
        this.handler = handler;

        const prefix = options.keyPrefix ?? "rosl:";
        this.KEY_PREFIX = (suffix) => `${prefix}${suffix}`;

        this.POLLING_RATE = options.pollingRate ?? 1000;
        this.MAX_RETRIES = options.maxRetries ?? 3;
        this.RETRY_BACKOFF = options.retryBackOf ?? 6000;
        this.LOCK_MS = options.lockMs ?? 10000;
    }

    /**
     *  Stores a `job` in Redis ZSET scored by `timestamp`.
     *  @param timestamp - Time to schedule the task at(in ms).
     *  @param data - Data to be processed at the timestamp.
     *  @returns `JobID` - JobID can be used for the further reference.
     */
    async schedule(timestamp: number, data: any): Promise<string> {
        if (!timestamp || timestamp < 0) {
            throw new Error("Invalid Timestamp.");
        }
        if (!data) {
            throw new Error("Invalid Data.");
        }
        if (timestamp < Date.now()) {
            throw new Error("Date Is Not From Future.");
        }
        const job: Job = { id: uuidv4(), timestamp, data };
        await this.redis.zadd(this.KEY_PREFIX("jobs:zset"), timestamp.toString(), JSON.stringify(job));
        return job.id;
    }

    /**
     *  Cancels the job with the provided `JobID`.
     *  @param jobID - Job ID of the job running on redis.
     *  @returns `Promise<Boolean>` - Returns `true` if the job exists and cancels the job, else false.
     */
    async cancel(jobID: string): Promise<Boolean> {
        if (!jobID) {
            throw new Error("Invalid JobID.");
        }
        const jobs = await this.redis.zrange(this.KEY_PREFIX("job:zset"), 0, -1);
        for (const job in jobs) {
            try {
                const j: Job = JSON.parse(job);
                if (j.id == jobID) {
                    await this.redis.zrem(this.KEY_PREFIX("jobs:zset"), job);
                    return true;
                }
            } catch (error) {
                throw new Error("Invalid Job ID.");
            }
        }
        return false;
    }

    /** Starts the worker with provided polling rate. */
    start() {
        if (this.pollInterval) return;
        this.pollInterval = setInterval(() => {
            this.taskRunner().catch(console.error)
        }, this.POLLING_RATE);
    }

    /** Stops the worker. */
    stop() {
        if (!this.pollInterval) return;
        clearInterval(this.pollInterval);
        this.pollInterval = null;
    }

    /** Internal: Execute the jobs. */
    private async taskRunner() {
        const now = Date.now();
        const due = await this.redis.zrangebyscore(this.KEY_PREFIX("job:zset"), 0, now);
        if (!due.length) return;
        for (const jobStr in due) {
            let job: Job | null = null;
            try {
                job = JSON.parse(jobStr)
            } catch (error) {
                await this.redis.zrem(this.KEY_PREFIX("job:zset"), jobStr);
                continue;
            }
            const lockKey = this.KEY_PREFIX(`lock:${job?.id}`);
            const lock = await this.redis.set(lockKey, "NX", "PX", this.LOCK_MS);
            if (!lock) continue;
            await this.redis.zrem(this.KEY_PREFIX("job:zset"), jobStr);
            try {
                await this.handler(job);
                await this.cleanUpKeys(job?.id);
            } catch (error) {
                const retryKey = this.KEY_PREFIX(`retries:${job?.id}`);
                const attempt = await this.redis.incr(retryKey);
                await this.redis.pexpire(retryKey, 7 * 24 * 60 * 60 * 1000);
                if (attempt <- this.MAX_RETRIES) {
                    const nextTime = Date.now() + this.RETRY_BACKOFF;
                    await this.redis.zadd(this.KEY_PREFIX("job:zset"), nextTime.toString(), jobStr);
                } else {
                    await this.redis.lpush(this.KEY_PREFIX("deadletter:list"), jobStr);
                    await this.redis.del(lockKey);
                }
            }
        }
    }

    /** Internal: Keys cleanup process. */
    private async cleanUpKeys(jobID: string | undefined) {
        await this.redis.del(this.KEY_PREFIX(`retries:${jobID}`));
        await this.redis.del(this.KEY_PREFIX(`lock:${jobID}`));
    }
}

export {
    OneOffScheduler
};
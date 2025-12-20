import { Queue } from 'bullmq';
import Redis from 'ioredis';

// 1. Create the Redis Connection
// We use a singleton pattern so we don't open 100 connections
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// 2. Create the "Email Queue"
// This is the bucket where we will dump all the email jobs
export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if AWS fails
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s, then 2s, then 4s...
    },
  },
});
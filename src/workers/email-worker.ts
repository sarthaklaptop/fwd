import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import 'dotenv/config';

// Initialize AWS SES (Same as before)
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

console.log("👷 Email Worker Started! Listening for jobs...");

const worker = new Worker('email-queue', async (job) => {
  console.log(`Processing Job ${job.id} to: ${job.data.to}`);

  // 1. Extract Data
  const { to, subject, html, text } = job.data;

  // 2. Send to AWS SES
  const command = new SendEmailCommand({
    Source: "sarthaklaptop402@gmail.com", // Replace with your verified email
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: html ? { Data: html } : undefined,
        Text: text ? { Data: text } : undefined,
      },
    },
  });

  const response = await ses.send(command);
  
  console.log(`✅ Sent! SES ID: ${response.MessageId}`);
  return response.MessageId;

}, { connection });

// Handle permanent failures (after all retries exhausted)
worker.on('failed', (job, err) => {
  console.error(`💀 Job ${job?.id} has permanently failed. Reason: ${err.message}`);
  // TODO: In the next milestone, we will update the Database status to 'failed' here.
});
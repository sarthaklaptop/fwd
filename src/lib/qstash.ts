import { Client } from "@upstash/qstash";

// Create QStash client singleton
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

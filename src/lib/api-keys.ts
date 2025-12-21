import { createHash, randomBytes } from 'crypto';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `fwd_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 12);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

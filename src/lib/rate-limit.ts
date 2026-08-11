interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record || record.resetAt <= now) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetMs: record.resetAt - now };
}

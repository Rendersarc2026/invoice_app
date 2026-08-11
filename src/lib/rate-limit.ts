interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * Hard ceiling on tracked keys. Keys are partly attacker-controlled (IP,
 * submitted email), so without a cap this map is a memory-exhaustion target.
 */
const MAX_TRACKED_KEYS = 10_000;

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  for (const [key, record] of tracker) {
    if (record.resetAt <= now) tracker.delete(key);
  }
}

/**
 * In-process fixed-window limiter.
 *
 * NOTE: state lives in this process only. On serverless/multi-instance hosting
 * the effective limit is (limit x instance count) and it resets on cold start,
 * so this is a speed bump — the authoritative brute-force defense is the
 * database-backed account lockout in lib/auth.ts. Move this to Redis/Upstash
 * if you need a limit that actually holds across instances.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  sweep(now);

  const record = tracker.get(key);

  if (!record || record.resetAt <= now) {
    if (tracker.size >= MAX_TRACKED_KEYS && !record) {
      // Shed rather than grow unbounded; the account lockout still applies.
      return { allowed: true, remaining: limit - 1, resetMs: windowMs };
    }
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetMs: record.resetAt - now };
}

/**
 * Client IP for rate-limit keying.
 *
 * `x-forwarded-for` is only trustworthy when a proxy you control sets it
 * (Vercel and most managed platforms overwrite it). Behind an untrusted edge a
 * caller can forge this header and rotate past the limiter; take the leftmost
 * entry, which is the value the closest trusted proxy appended.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

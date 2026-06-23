// In-memory rate limiter — resets on server restart.
// Good enough for MVP. Upgrade to Redis for production.

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds * 1000 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining, resetAt: entry.resetAt };
}

// Pre-built limiters
export function apiRateLimit(ip: string) {
  return checkRateLimit(`api:${ip}`, 100, 60); // 100 req/min per IP
}

export function authRateLimit(ip: string) {
  return checkRateLimit(`auth:${ip}`, 10, 60); // 10 attempts/min per IP
}

export function signupRateLimit(ip: string) {
  return checkRateLimit(`signup:${ip}`, 3, 3600); // 3 signups/hour per IP
}

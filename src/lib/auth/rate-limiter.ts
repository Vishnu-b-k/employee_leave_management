interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window store for login attempts
const ipRateLimits = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRateLimits.entries()) {
      if (now > record.resetTime) {
        ipRateLimits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Checks rate limiting for an IP address.
 *
 * @param ip Client IP address
 * @param maxAttempts Maximum attempts within the window (default 5)
 * @param windowMs Time window in milliseconds (default 60 seconds)
 * @returns { allowed: boolean, remaining: number, resetInSeconds: number }
 */
export function checkRateLimit(
  ip: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxAttempts - record.count);
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}

/**
 * Resets rate limit for an IP on successful login.
 */
export function resetRateLimit(ip: string): void {
  ipRateLimits.delete(ip);
}

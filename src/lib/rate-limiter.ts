
'use server';

// A simple in-memory store for rate limiting.
// In production, this should be replaced with a more persistent and scalable
// solution like Redis, Memcached, or a dedicated Firestore collection.
const requestCounts = new Map<string, { count: number; expiry: number }>();

const RATE_LIMITS = {
  ip: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  user: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
};

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Checks if a request from a given identifier should be allowed.
 *
 * @param identifier A unique string representing the source (e.g., IP address, user ID).
 * @param type The type of identifier, used to apply the correct limit.
 * @returns True if the request is within the limit, false otherwise.
 */
export function isRateLimited(identifier: string, type: RateLimitType): boolean {
  // In a real production environment, you would replace this with a call to a distributed
  // cache like Redis to ensure rate limits are shared across all server instances.
  // For this prototype, the in-memory limiter provides basic protection.
  
  const now = Date.now();
  const limitConfig = RATE_LIMITS[type];
  const record = requestCounts.get(identifier);

  // If no record exists or the record has expired, create a new one.
  if (!record || record.expiry < now) {
    requestCounts.set(identifier, {
      count: 1,
      expiry: now + limitConfig.windowMs,
    });
    return false; // Not limited
  }

  // Increment the count for the current window.
  record.count++;

  // Clean up expired entries periodically to prevent memory leaks.
  if (Math.random() < 0.01) { // 1% chance to clean up on any given request
    cleanupExpired();
  }

  // Check if the count exceeds the maximum allowed requests.
  if (record.count > limitConfig.maxRequests) {
    console.warn(`Rate limit exceeded for ${type}: ${identifier}`);
    return true; // Limited
  }

  return false; // Not limited
}

/**
 * Iterates through the map and removes expired entries.
 */
function cleanupExpired() {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (record.expiry < now) {
            requestCounts.delete(key);
        }
    }
}

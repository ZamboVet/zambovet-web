// Simple in-memory rate limiter
// Note: In production, you should use Redis or another external store

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SimpleRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  public isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      return false; // Rate limit exceeded
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);
    return true;
  }

  public getRemainingTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new SimpleRateLimiter();

export default rateLimiter;

// Common rate limit configurations
export const RATE_LIMITS = {
  AUTH: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  API: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  ADMIN: { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute for admin ops
} as const;

// Helper function to get client IP
export function getClientIP(request: Request): string {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}

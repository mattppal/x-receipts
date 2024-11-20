import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const rateLimiter = new RateLimiterMemory({
  points: 3, // Number of requests
  duration: 24 * 60 * 60, // Per 24 hours (in seconds)
});

export async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for cached responses
  if (req.headers['x-cache-hit'] === 'true') {
    return next();
  }

  const clientId = req.headers['x-forwarded-for']?.toString() || req.ip;

  try {
    const rateLimiterRes = await rateLimiter.consume(clientId);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints),
      'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
    });
    
    next();
  } catch (error: any) {
    const resetTime = new Date(Date.now() + error.msBeforeNext).toISOString();
    
    res.set({
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime
    });

    return res.status(429).json({
      error: 'Rate limit exceeded',
      details: 'You can only generate 3 receipts every 24 hours',
      resetTime
    });
  }
}

export async function getRateLimitInfo(req: Request) {
  const clientId = req.headers['x-forwarded-for']?.toString() || req.ip;
  
  try {
    const res = await rateLimiter.get(clientId);
    return {
      remaining: res ? res.remainingPoints : 3,
      limit: 3,
      resetTime: res ? new Date(Date.now() + res.msBeforeNext).toISOString() : null
    };
  } catch (error) {
    return {
      remaining: 3,
      limit: 3,
      resetTime: null
    };
  }
}

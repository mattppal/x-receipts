import { Request, Response, NextFunction } from 'express';
import { Client } from '@replit/database';

const db = new Client();
const POINTS_PER_DAY = 3;
const DURATION_SECONDS = 24 * 60 * 60; // 24 hours in seconds

interface RateLimitInfo {
  points: number;
  lastReset: number;
}

export async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for cached responses
  if (req.headers['x-cache-hit'] === 'true') {
    return next();
  }

  const clientId = req.headers['x-forwarded-for']?.toString() || req.ip;
  const key = `ratelimit:${clientId}`;
  
  try {
    // Get current rate limit info
    let info = await db.get<RateLimitInfo>(key);
    const now = Date.now();
    
    // Initialize if not exists or reset if expired
    if (!info || (now - info.lastReset) >= DURATION_SECONDS * 1000) {
      info = {
        points: POINTS_PER_DAY,
        lastReset: now
      };
    }

    // Check if there are points remaining
    if (info.points <= 0) {
      const resetTime = new Date(info.lastReset + DURATION_SECONDS * 1000);
      
      res.set({
        'X-RateLimit-Limit': String(POINTS_PER_DAY),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toISOString()
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        details: 'You can only generate 3 receipts every 24 hours',
        resetTime: resetTime.toISOString()
      });
    }

    // Consume a point
    info.points--;
    await db.set(key, info);

    // Set rate limit headers
    const resetTime = new Date(info.lastReset + DURATION_SECONDS * 1000);
    res.set({
      'X-RateLimit-Limit': String(POINTS_PER_DAY),
      'X-RateLimit-Remaining': String(info.points),
      'X-RateLimit-Reset': resetTime.toISOString()
    });

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request in case of DB errors
    next();
  }
}

export async function getRateLimitInfo(req: Request) {
  const clientId = req.headers['x-forwarded-for']?.toString() || req.ip;
  const key = `ratelimit:${clientId}`;
  
  try {
    const info = await db.get<RateLimitInfo>(key);
    const now = Date.now();
    
    if (!info || (now - info.lastReset) >= DURATION_SECONDS * 1000) {
      return {
        remaining: POINTS_PER_DAY,
        limit: POINTS_PER_DAY,
        resetTime: new Date(now + DURATION_SECONDS * 1000).toISOString()
      };
    }

    return {
      remaining: info.points,
      limit: POINTS_PER_DAY,
      resetTime: new Date(info.lastReset + DURATION_SECONDS * 1000).toISOString()
    };
  } catch (error) {
    console.error('Failed to get rate limit info:', error);
    return {
      remaining: POINTS_PER_DAY,
      limit: POINTS_PER_DAY,
      resetTime: null
    };
  }
}

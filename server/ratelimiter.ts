import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { xUserCache } from "../db/schema";

const RATE_LIMIT = 30; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  
  try {
    // Get current rate limit data
    const result = await db
      .select()
      .from(xUserCache)
      .where(eq(xUserCache.username, key))
      .limit(1);

    let rateData = result[0]?.data as { count: number; resetAt: number } | undefined;

    if (!rateData || now > rateData.resetAt) {
      // Initialize new window
      rateData = {
        count: 1,
        resetAt: now + WINDOW_MS
      };
    } else {
      // Increment count in current window
      rateData.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - rateData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateData.resetAt / 1000));

    // Check if rate limit exceeded
    if (rateData.count > RATE_LIMIT) {
      return res.status(429).json({
        error: "Too Many Requests",
        details: "Rate limit exceeded. Please try again later.",
      });
    }

    // Update rate limit data
    await db
      .insert(xUserCache)
      .values({
        username: key,
        data: rateData,
        cached_at: new Date(),
      })
      .onConflictDoUpdate({
        target: xUserCache.username,
        set: {
          data: rateData,
          cached_at: new Date(),
        },
      });

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request in case of error
    next();
  }
}

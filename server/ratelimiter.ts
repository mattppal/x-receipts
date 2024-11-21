import { Request, Response, NextFunction } from "express";
import { Database } from "@replit/database";

const RATE_LIMIT = 30; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const db = new Database();

  try {
    // Get current rate limit data
    const rateData = await db.get(key) as { count: number; resetAt: number } | null;

    let currentData;
    if (!rateData || now > rateData.resetAt) {
      // Initialize new window
      currentData = {
        count: 1,
        resetAt: now + WINDOW_MS,
      };
    } else {
      // Increment count in current window
      currentData = {
        count: rateData.count + 1,
        resetAt: rateData.resetAt,
      };
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, RATE_LIMIT - currentData.count),
    );
    res.setHeader("X-RateLimit-Reset", Math.ceil(currentData.resetAt / 1000));

    // Check if rate limit exceeded
    if (currentData.count > RATE_LIMIT) {
      return res.status(429).json({
        error: "Too Many Requests",
        details: "Rate limit exceeded. Please try again later.",
      });
    }

    // Update rate limit data
    await db.set(key, currentData);

    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request in case of error
    next();
  }
}
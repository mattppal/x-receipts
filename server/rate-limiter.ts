import { Request } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: Date;
}

export class RateLimiter {
  private limits: Map<string, RateLimitInfo> = new Map();
  private readonly MAX_REQUESTS = 3;
  private readonly WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getClientId(req: Request): string {
    return req.headers['x-forwarded-for']?.toString() || req.ip;
  }

  public isRateLimited(req: Request): boolean {
    const clientId = this.getClientId(req);
    const now = new Date();
    const clientLimit = this.limits.get(clientId);

    // If no existing rate limit info or window has expired
    if (!clientLimit || now > clientLimit.resetTime) {
      this.limits.set(clientId, {
        count: 1,
        resetTime: new Date(now.getTime() + this.WINDOW_MS)
      });
      return false;
    }

    // If within window but exceeded limit
    if (clientLimit.count >= this.MAX_REQUESTS) {
      return true;
    }

    // Increment counter
    clientLimit.count += 1;
    return false;
  }

  public getRateLimitInfo(req: Request): {
    remaining: number;
    limit: number;
    resetTime: Date | null;
  } {
    const clientId = this.getClientId(req);
    const clientLimit = this.limits.get(clientId);

    if (!clientLimit) {
      return {
        remaining: this.MAX_REQUESTS,
        limit: this.MAX_REQUESTS,
        resetTime: null
      };
    }

    return {
      remaining: Math.max(0, this.MAX_REQUESTS - clientLimit.count),
      limit: this.MAX_REQUESTS,
      resetTime: clientLimit.resetTime
    };
  }
}

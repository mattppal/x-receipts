import { TwitterApi } from "twitter-api-v2";
import { Router } from "express";
import { db } from "../db";
import { xUserCache } from "../db/schema";
import { eq } from "drizzle-orm";
import { RateLimiter } from "./rate-limiter";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const BYPASS_CACHE = process.env.NODE_ENV === "development" && process.env.FORCE_BYPASS_CACHE === "true";

const rateLimiter = new RateLimiter();

// Add logging utility function
function logApiResponse(label: string, data: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${label}]`, JSON.stringify(data, null, 2));
  }
}

export function registerRoutes(app: Router) {
  // Rate limit status endpoint
  app.get("/api/rate-limit", (req, res) => {
    const info = rateLimiter.getRateLimitInfo(req);
    res.json(info);
  });

  app.get("/api/x/users/:username", async (req, res) => {
    if (!process.env.X_BEARER_TOKEN) {
      return res.status(500).json({
        error: "X API token not configured",
        details: "Missing X_BEARER_TOKEN environment variable",
      });
    }

    // Check cache first to avoid counting cached responses against rate limit
    const username = req.params.username.toLowerCase();
    if (!BYPASS_CACHE && !req.query.nocache) {
      try {
        const cachedData = await db
          .select()
          .from(xUserCache)
          .where(eq(xUserCache.username, username))
          .limit(1);

        if (cachedData.length > 0) {
          const cache = cachedData[0];
          const cacheAge = Date.now() - cache.cached_at.getTime();

          if (cacheAge < CACHE_DURATION_MS) {
            res.set("X-Cache-Hit", "true");
            return res.json(cache.data);
          }
        }
      } catch (error) {
        console.error("Cache error:", error);
      }
    }

    // Apply rate limiting for non-cached requests
    if (rateLimiter.isRateLimited(req)) {
      const info = rateLimiter.getRateLimitInfo(req);
      return res.status(429).json({
        error: "Rate limit exceeded",
        details: "You can only generate 3 receipts every 24 hours",
        resetTime: info.resetTime
      });
    }

    // Fetch user data from Twitter API
    try {
      const client = new TwitterApi(process.env.X_BEARER_TOKEN);

      const user = await client.v2.userByUsername(username, {
        "user.fields": [
          "id",
          "name",
          "username",
          "created_at",
          "description",
          "entities",
          "location",
          "pinned_tweet_id",
          "profile_image_url",
          "protected",
          "public_metrics",
          "url",
          "verified_type",
          "withheld",
        ],
      });

      logApiResponse("User API Response", user);

      if (!user.data) {
        return res.status(404).json({
          error: "User not found",
          details: `X user "${username}" does not exist`,
        });
      }

      let pinnedTweet;
      if (user.data.pinned_tweet_id) {
        try {
          const tweet = await client.v2.singleTweet(user.data.pinned_tweet_id, {
            "tweet.fields": [
              "created_at",
              "public_metrics",
              "attachments",
              "entities",
            ],
          });
          logApiResponse("Pinned Tweet API Response", tweet);
          pinnedTweet = tweet.data;
        } catch (error) {
          console.error("Failed to fetch pinned tweet:", error);
        }
      }

      const processedEntities = {
        url: user.data.entities?.url,
        description: {
          ...user.data.entities?.description,
          mentions:
            user.data.entities?.description?.mentions?.map((mention) => ({
              ...mention,
              username: mention.username || "",
              start: mention.start || 0,
              end: mention.end || 0,
            })) || [],
        },
      };

      const formattedData = {
        id: user.data.id,
        name: user.data.name,
        username: user.data.username,
        created_at: user.data.created_at,
        description: user.data.description,
        entities: processedEntities,
        location: user.data.location,
        pinned_tweet_id: user.data.pinned_tweet_id,
        profile_image_url: user.data.profile_image_url?.replace("_normal", ""),
        protected: user.data.protected,
        public_metrics: user.data.public_metrics,
        url: user.data.url,
        verified_type: user.data.verified_type || 'none',
        withheld: user.data.withheld,
        pinned_tweet: pinnedTweet
          ? {
              text: pinnedTweet.text,
              created_at: pinnedTweet.created_at,
              retweet_count: pinnedTweet.public_metrics?.retweet_count ?? 0,
              reply_count: pinnedTweet.public_metrics?.reply_count ?? 0,
              like_count: pinnedTweet.public_metrics?.like_count ?? 0,
              media: pinnedTweet.attachments?.media_keys
                ? pinnedTweet.attachments.media_keys.map((key) => ({ key }))
                : [],
            }
          : undefined,
      };

      logApiResponse("Formatted Response", formattedData);

      if (!BYPASS_CACHE) {
        try {
          await db
            .insert(xUserCache)
            .values({
              username: username,
              data: formattedData,
              cached_at: new Date(),
            })
            .onConflictDoUpdate({
              target: xUserCache.username,
              set: {
                data: formattedData,
                cached_at: new Date(),
              },
            });
        } catch (cacheError) {
          console.error("Cache update error:", cacheError);
        }
      }

      const rateInfo = rateLimiter.getRateLimitInfo(req);
      res.set("X-RateLimit-Remaining", rateInfo.remaining.toString());
      res.set("X-RateLimit-Reset", rateInfo.resetTime?.toISOString() || '');
      res.set("X-Cache-Hit", "false");
      res.json(formattedData);
    } catch (error: any) {
      console.error("X API error:", error);
      logApiResponse("Error Response", error);

      if (
        error.code === 429 ||
        (error.errors && error.errors[0]?.code === 88)
      ) {
        const resetTime = error.rateLimit?.reset
          ? new Date(error.rateLimit.reset * 1000).toISOString()
          : undefined;

        if (error.rateLimit?.reset) {
          const retryAfter = Math.max(
            1,
            Math.ceil((error.rateLimit.reset * 1000 - Date.now()) / 1000),
          );
          res.set("Retry-After", retryAfter.toString());
        }

        return res.status(429).json({
          error: "X API rate limit exceeded",
          details: `Please try again later${resetTime ? ` after ${resetTime}` : ""}`,
          resetTime,
        });
      }

      if (error.code === 401) {
        return res.status(401).json({
          error: "Authentication error",
          details: "Invalid or expired API token",
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          error: "Access denied",
          details: "The request is not authorized",
        });
      }

      res.status(500).json({
        error: "Failed to fetch X data",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

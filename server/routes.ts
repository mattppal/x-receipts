import type { Express } from "express";
import { TwitterApi } from "twitter-api-v2";
import { db } from "../db";
import { xUserCache } from "../db/schema";
import { eq } from "drizzle-orm";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const BYPASS_CACHE = process.env.NODE_ENV === 'development';

export function registerRoutes(app: Express) {
  app.get("/api/x/users/:username", async (req, res) => {
    if (!process.env.X_BEARER_TOKEN) {
      return res.status(500).json({
        error: "X API token not configured",
        details: "Missing X_BEARER_TOKEN environment variable",
      });
    }

    try {
      // Check cache first (unless bypassed)
      if (!BYPASS_CACHE && !req.query.nocache) {
        const cachedData = await db
          .select()
          .from(xUserCache)
          .where(eq(xUserCache.username, req.params.username));

        const now = Date.now();
        if (cachedData.length > 0) {
          const cache = cachedData[0];
          const cacheAge = now - cache.cached_at.getTime();

          // Return cached data if valid
          if (cacheAge < CACHE_DURATION_MS) {
            return res.json(cache.data);
          }
        }
      }

      // Fetch fresh data from X API
      const client = new TwitterApi(process.env.X_BEARER_TOKEN);

      // Fetch user data
      const user = await client.v2.userByUsername(req.params.username, {
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
          "verified",
          "withheld"
        ],
      });

      if (!user.data) {
        return res.status(404).json({
          error: "User not found",
          details: `X user "${req.params.username}" does not exist`,
        });
      }

      // Fetch pinned tweet if it exists
      let pinnedTweet;
      if (user.data.pinned_tweet_id) {
        try {
          const tweet = await client.v2.singleTweet(user.data.pinned_tweet_id, {
            "tweet.fields": ["created_at", "public_metrics", "attachments", "entities"],
          });
          pinnedTweet = tweet.data;
        } catch (error) {
          console.error("Failed to fetch pinned tweet:", error);
        }
      }

      // Format the response according to the new schema
      const formattedData = {
        id: user.data.id,
        name: user.data.name,
        username: user.data.username,
        created_at: user.data.created_at,
        description: user.data.description,
        entities: user.data.entities,
        location: user.data.location,
        pinned_tweet_id: user.data.pinned_tweet_id,
        profile_image_url: user.data.profile_image_url?.replace("_normal", ""),
        protected: user.data.protected,
        public_metrics: user.data.public_metrics,
        url: user.data.url,
        verified: user.data.verified,
        withheld: user.data.withheld,
        pinned_tweet: pinnedTweet ? {
          text: pinnedTweet.text,
          created_at: pinnedTweet.created_at,
          retweet_count: pinnedTweet.public_metrics?.retweet_count ?? 0,
          reply_count: pinnedTweet.public_metrics?.reply_count ?? 0,
          like_count: pinnedTweet.public_metrics?.like_count ?? 0,
          media: pinnedTweet.attachments?.media_keys
            ? pinnedTweet.attachments.media_keys.map((key) => ({ key }))
            : [],
        } : undefined,
      };

      // Store in cache (unless bypassed)
      if (!BYPASS_CACHE) {
        await db
          .insert(xUserCache)
          .values({
            username: req.params.username,
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
      }

      res.set("Cache-Control", "public, max-age=300");
      res.json(formattedData);
    } catch (error: any) {
      console.error("X API error:", error);

      if (error.code === 429 || (error.errors && error.errors[0]?.code === 88)) {
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

function formatTweetCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
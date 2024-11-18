import type { Express } from "express";
import { TwitterApi } from 'twitter-api-v2';
import { db } from '../db';
import { xUserCache, personalizedTrendsCache } from '../db/schema'; // Added personalizedTrendsCache import
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm'; // Added for SQL queries

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRENDS_CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function registerRoutes(app: Express) {
  // Existing user endpoint
  app.get('/api/x/users/:username', async (req, res) => {
    if (!process.env.X_BEARER_TOKEN) {
      return res.status(500).json({ 
        error: 'X API token not configured',
        details: 'Missing X_BEARER_TOKEN environment variable'
      });
    }

    try {
      // Check cache first
      const cachedData = await db.select()
        .from(xUserCache)
        .where(eq(xUserCache.username, req.params.username));

      if (cachedData.length > 0) {
        const cache = cachedData[0];
        const cacheAge = Date.now() - cache.cached_at.getTime();
        
        if (cacheAge < CACHE_DURATION_MS) {
          // Return cached data if it's still valid
          return res.json(cache.data);
        }
        
        // Delete expired cache
        await db.delete(xUserCache)
          .where(eq(xUserCache.username, req.params.username));
      }

      // Fetch fresh data from X API
      const client = new TwitterApi(process.env.X_BEARER_TOKEN);
      const user = await client.v2.userByUsername(req.params.username, {
        'user.fields': [
          'public_metrics',
          'created_at',
          'profile_image_url',
          'description',
          'location',
          'verified',
          'protected',
          'url',
          'entities',
          'pinned_tweet_id'
        ]
      });
      
      if (!user.data) {
        return res.status(404).json({ 
          error: 'User not found',
          details: `X user "${req.params.username}" does not exist`
        });
      }

      // Enhanced user data with additional fields
      const userData = {
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count ?? 0,
        following_count: user.data.public_metrics?.following_count ?? 0,
        tweet_count: user.data.public_metrics?.tweet_count ?? 0,
        listed_count: user.data.public_metrics?.listed_count ?? 0,
        likes_count: user.data.public_metrics?.like_count ?? 0,
        created_at: user.data.created_at,
        profile_image_url: user.data.profile_image_url?.replace('_normal', ''),
        description: user.data.description,
        location: user.data.location,
        verified: user.data.verified ?? false,
        protected: user.data.protected ?? false,
        url: user.data.url,
        entities: user.data.entities,
        pinned_tweet_id: user.data.pinned_tweet_id
      };

      // Store in cache
      await db.insert(xUserCache)
        .values({
          username: req.params.username,
          data: userData,
          cached_at: new Date()
        })
        .onConflictDoUpdate({
          target: xUserCache.username,
          set: {
            data: userData,
            cached_at: new Date()
          }
        });

      res.set('Cache-Control', 'public, max-age=300');
      res.json(userData);
    } catch (error: any) {
      console.error('X API error:', error);
      
      if (error.code === 429 || (error.errors && error.errors[0]?.code === 88)) {
        const resetTime = error.rateLimit?.reset 
          ? new Date(error.rateLimit.reset * 1000).toISOString()
          : undefined;
        
        if (error.rateLimit?.reset) {
          const retryAfter = Math.max(1, Math.ceil((error.rateLimit.reset * 1000 - Date.now()) / 1000));
          res.set('Retry-After', retryAfter.toString());
        }
          
        return res.status(429).json({ 
          error: 'X API rate limit exceeded',
          details: `Please try again later${resetTime ? ` after ${resetTime}` : ''}`,
          resetTime
        });
      }

      if (error.code === 401) {
        return res.status(401).json({
          error: 'Authentication error',
          details: 'Invalid or expired API token'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          error: 'Access denied',
          details: 'The request is not authorized'
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch X data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Updated personalized trends endpoint
  app.get('/api/x/trends/personalized', async (req, res) => {
    if (!process.env.X_BEARER_TOKEN) {
      return res.status(500).json({ 
        error: 'X API token not configured',
        details: 'Missing X_BEARER_TOKEN environment variable'
      });
    }

    try {
      // Check cache first
      const cachedTrends = await db.select()
        .from(personalizedTrendsCache)
        .where(sql`expires_at > NOW()`)
        .limit(1);

      if (cachedTrends.length > 0) {
        return res.json(cachedTrends[0].data);
      }

      // Fetch fresh data from X API
      const client = new TwitterApi(process.env.X_BEARER_TOKEN);
      const trends = await client.v2.get('users/personalized_trends');
      
      // Transform the response to match the required format
      const formattedTrends = {
        data: trends.data.map((trend: any) => ({
          category: trend.category || 'General',
          post_count: trend.tweet_volume ? `${formatTweetCount(trend.tweet_volume)} posts` : 'N/A posts',
          trend_name: trend.name,
          trending_since: trend.trending_since || 'Trending now'
        }))
      };

      // Store in cache
      await db.delete(personalizedTrendsCache);
      await db.insert(personalizedTrendsCache)
        .values({
          data: formattedTrends,
          cached_at: new Date(),
          expires_at: new Date(Date.now() + TRENDS_CACHE_DURATION_MS)
        });
      
      res.json(formattedTrends);
    } catch (error: any) {
      console.error('X API error:', error);
      
      if (error.code === 429) {
        return res.status(429).json({ 
          error: 'X API rate limit exceeded',
          details: 'Please try again later'
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch personalized trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Helper function to format tweet counts
function formatTweetCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
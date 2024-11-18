import type { Express } from "express";
import { TwitterApi } from 'twitter-api-v2';
import { db } from '../db';
import { xUserCache } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

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

      const now = Date.now();
      if (cachedData.length > 0) {
        const cache = cachedData[0];
        const cacheAge = now - cache.cached_at.getTime();
        const trendsAge = cache.trends_cached_at ? now - cache.trends_cached_at.getTime() : Infinity;
        
        // Return cached data if both user and trends data are valid
        if (cacheAge < CACHE_DURATION_MS && trendsAge < TRENDS_CACHE_DURATION_MS) {
          return res.json({
            ...cache.data,
            trends: cache.trends_data
          });
        }
      }

      // Fetch fresh data from X API
      const client = new TwitterApi(process.env.X_BEARER_TOKEN);
      
      // Fetch user data
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

      // Fetch pinned tweet if it exists
      let pinnedTweet;
      if (user.data.pinned_tweet_id) {
        try {
          const tweet = await client.v2.singleTweet(user.data.pinned_tweet_id, {
            'tweet.fields': ['created_at', 'public_metrics', 'attachments']
          });
          pinnedTweet = tweet.data;
        } catch (error) {
          console.error('Failed to fetch pinned tweet:', error);
        }
      }

      // Fetch personalized trends
      let trends;
      try {
        const trendsResponse = await client.v2.get('users/personalized_trends');
        trends = {
          data: trendsResponse.data.map((trend: any) => ({
            category: trend.category || 'General',
            post_count: trend.tweet_volume ? `${formatTweetCount(trend.tweet_volume)} posts` : 'N/A posts',
            trend_name: trend.name,
            trending_since: trend.trending_since || 'Trending now'
          }))
        };
      } catch (error) {
        console.error('Failed to fetch trends:', error);
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
        pinned_tweet_id: user.data.pinned_tweet_id,
        pinned_tweet: pinnedTweet ? {
          text: pinnedTweet.text,
          created_at: pinnedTweet.created_at,
          retweet_count: pinnedTweet.public_metrics?.retweet_count ?? 0,
          reply_count: pinnedTweet.public_metrics?.reply_count ?? 0,
          like_count: pinnedTweet.public_metrics?.like_count ?? 0,
          media: pinnedTweet.attachments?.media_keys ? 
            pinnedTweet.attachments.media_keys.map(key => ({ key })) : []
        } : undefined
      };

      // Store in cache
      await db.insert(xUserCache)
        .values({
          username: req.params.username,
          data: userData,
          cached_at: new Date(),
          trends_data: trends,
          trends_cached_at: trends ? new Date() : null
        })
        .onConflictDoUpdate({
          target: xUserCache.username,
          set: {
            data: userData,
            cached_at: new Date(),
            trends_data: trends,
            trends_cached_at: trends ? new Date() : null
          }
        });

      res.set('Cache-Control', 'public, max-age=300');
      res.json({
        ...userData,
        trends
      });
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
import type { Express } from "express";
import { TwitterApi } from 'twitter-api-v2';

export function registerRoutes(app: Express) {
  app.get('/api/twitter/users/:username', async (req, res) => {
    if (!process.env.TWITTER_BEARER_TOKEN) {
      return res.status(500).json({ 
        error: 'X API token not configured',
        details: 'Missing X_BEARER_TOKEN environment variable'
      });
    }

    try {
      const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
      const user = await client.v2.userByUsername(req.params.username, {
        'user.fields': ['public_metrics', 'created_at', 'profile_image_url', 'description', 'location', 'verified']
      });
      
      if (!user.data) {
        return res.status(404).json({ 
          error: 'User not found',
          details: `X user "${req.params.username}" does not exist`
        });
      }

      const userData = {
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count ?? 0,
        following_count: user.data.public_metrics?.following_count ?? 0,
        tweet_count: user.data.public_metrics?.tweet_count ?? 0,
        listed_count: user.data.public_metrics?.listed_count ?? 0,
        likes_count: user.data.public_metrics?.like_count ?? 0,
        created_at: user.data.created_at,
        profile_image_url: user.data.profile_image_url,
        description: user.data.description,
        location: user.data.location,
        verified: user.data.verified ?? false,
      };

      res.json(userData);
    } catch (error: any) {
      console.error('X API error:', error);
      
      if (error.code === 429 || (error.errors && error.errors[0]?.code === 88)) {
        const resetTime = error.rateLimit?.reset 
          ? new Date(error.rateLimit.reset * 1000).toISOString()
          : undefined;
          
        return res.status(429).json({ 
          error: 'X API rate limit exceeded',
          details: `Please try again later${resetTime ? ` after ${resetTime}` : ''}`,
          resetTime
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch X data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

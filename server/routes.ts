import type { Express } from "express";
import { TwitterApi } from 'twitter-api-v2';

export function registerRoutes(app: Express) {
  // Twitter API proxy route
  app.get('/api/twitter/users/:username', async (req, res) => {
    if (!process.env.TWITTER_BEARER_TOKEN) {
      return res.status(500).json({ 
        error: 'Twitter API token not configured',
        details: 'Missing TWITTER_BEARER_TOKEN environment variable'
      });
    }

    try {
      const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
      const user = await client.v2.userByUsername(req.params.username, {
        'user.fields': ['public_metrics', 'created_at', 'profile_image_url', 'description']
      });
      
      if (!user.data) {
        return res.status(404).json({ 
          error: 'User not found',
          details: `Twitter user "${req.params.username}" does not exist`
        });
      }

      const userData = {
        username: user.data.username,
        name: user.data.name,
        followers_count: user.data.public_metrics?.followers_count ?? 0,
        following_count: user.data.public_metrics?.following_count ?? 0,
        tweet_count: user.data.public_metrics?.tweet_count ?? 0,
        created_at: user.data.created_at,
        profile_image_url: user.data.profile_image_url,
        description: user.data.description,
      };

      res.json(userData);
    } catch (error) {
      console.error('Twitter API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch Twitter data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Keep the GitHub route for reference
  app.get('/api/github/users/:username', async (req, res) => {
    try {
      const response = await fetch(`https://api.github.com/users/${req.params.username}`);
      if (!response.ok) {
        throw new Error('GitHub API request failed');
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }
  });
}

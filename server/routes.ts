import type { Express } from "express";
import { TwitterApi } from 'twitter-api-v2';

export function registerRoutes(app: Express) {
  // Twitter API proxy route
  app.get('/api/twitter/users/:username', async (req, res) => {
    try {
      const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);
      const user = await client.v2.userByUsername(req.params.username, {
        'user.fields': ['public_metrics', 'created_at', 'profile_image_url', 'description']
      });
      
      if (!user.data) {
        throw new Error('Twitter user not found');
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
      res.status(500).json({ error: 'Failed to fetch Twitter data' });
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

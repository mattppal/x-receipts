import type { Express } from "express";

export function registerRoutes(app: Express) {
  // GitHub API proxy route to avoid rate limiting
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

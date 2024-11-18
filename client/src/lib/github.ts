import { z } from 'zod';

const githubUserSchema = z.object({
  login: z.string(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GithubUser = z.infer<typeof githubUserSchema>;

export async function fetchGithubUser(username: string): Promise<GithubUser> {
  const response = await fetch(`https://api.github.com/users/${username}`);
  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user');
  }
  const data = await response.json();
  return githubUserSchema.parse(data);
}

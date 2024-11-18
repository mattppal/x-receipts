import { z } from 'zod';
import { TwitterApi } from 'twitter-api-v2';

export const twitterUserSchema = z.object({
  username: z.string(),
  name: z.string(),
  followers_count: z.number(),
  following_count: z.number(),
  tweet_count: z.number(),
  created_at: z.string(),
  profile_image_url: z.string().optional(),
  description: z.string().optional(),
});

export type TwitterUser = z.infer<typeof twitterUserSchema>;

export async function fetchTwitterUser(username: string): Promise<TwitterUser> {
  const response = await fetch(`/api/twitter/users/${username}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw {
      message: data.error || 'Failed to fetch Twitter user',
      details: data.details || 'Unknown error occurred'
    };
  }
  
  return twitterUserSchema.parse(data);
}

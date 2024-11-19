import { z } from 'zod';

const urlEntitySchema = z.object({
  urls: z.array(z.object({
    start: z.number(),
    end: z.number(),
    url: z.string(),
    expanded_url: z.string(),
    display_url: z.string()
  }))
});

const descriptionEntitySchema = z.object({
  urls: z.array(z.object({
    start: z.number(),
    end: z.number(),
    url: z.string(),
    expanded_url: z.string(),
    display_url: z.string()
  })).optional(),
  hashtags: z.array(z.object({
    start: z.number(),
    end: z.number(),
    tag: z.string()
  })).optional(),
  mentions: z.array(z.object({
    start: z.number(),
    end: z.number(),
    tag: z.string().optional()
  })).optional(),
  cashtags: z.array(z.object({
    start: z.number(),
    end: z.number(),
    tag: z.string()
  })).optional()
});

const pinnedTweetSchema = z.object({
  text: z.string(),
  created_at: z.string(),
  retweet_count: z.number(),
  reply_count: z.number(),
  like_count: z.number(),
  media: z.array(z.object({ key: z.string() })).optional()
});

export const xUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  connection_status: z.array(z.string()).optional(),
  created_at: z.string(),
  description: z.string().optional(),
  entities: z.object({
    url: urlEntitySchema.optional(),
    description: descriptionEntitySchema.optional(),
  }).optional(),
  location: z.string().optional(),
  pinned_tweet_id: z.string().optional(),
  pinned_tweet: pinnedTweetSchema.optional(),
  profile_image_url: z.string().optional(),
  protected: z.boolean(),
  public_metrics: z.object({
    followers_count: z.number(),
    following_count: z.number(),
    tweet_count: z.number(),
    listed_count: z.number()
  }),
  url: z.string().optional(),
  verified: z.boolean(),
  withheld: z.object({}).optional()
});

export type XUser = z.infer<typeof xUserSchema>;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchXUser(username: string, retryCount = 3): Promise<XUser> {
  try {
    const response = await fetch(`/api/x/users/${username}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || '60';
        const resetTime = data.resetTime ? new Date(data.resetTime) : undefined;
        
        throw {
          status: 429,
          message: 'Rate limit exceeded',
          details: `Please try again ${resetTime ? `after ${resetTime.toLocaleTimeString()}` : 'later'}`,
          retryAfter: parseInt(retryAfter, 10)
        };
      }

      if (response.status === 401) {
        throw {
          status: 401,
          message: 'Authentication error',
          details: 'Please check your API token configuration'
        };
      }
      
      throw {
        message: data.error || 'Failed to fetch X user',
        details: data.details || 'Unknown error occurred'
      };
    }
    
    return xUserSchema.parse(data);
  } catch (error: any) {
    if (error.status === 429 && retryCount > 0) {
      const retryAfter = error.retryAfter || 60;
      await delay(retryAfter * 1000);
      return fetchXUser(username, retryCount - 1);
    }
    throw error;
  }
}

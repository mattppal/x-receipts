import { z } from 'zod';

export const xUserSchema = z.object({
  username: z.string(),
  name: z.string(),
  followers_count: z.number(),
  following_count: z.number(),
  tweet_count: z.number(),
  created_at: z.string(),
  profile_image_url: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  listed_count: z.number(),
  likes_count: z.number(),
  verified: z.boolean().optional(),
  protected: z.boolean().optional(),
  url: z.string().optional(),
  entities: z.object({}).optional(),
  pinned_tweet_id: z.string().optional()
});

export type XUser = z.infer<typeof xUserSchema>;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchXUser(username: string, retryCount = 3): Promise<XUser> {
  try {
    const response = await fetch(`/api/x/users/${username}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'  // Bypass browser cache for fresh data
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

export const trendSchema = z.object({
  name: z.string(),
  url: z.string(),
  promoted_content: z.string().nullable(),
  query: z.string(),
  tweet_volume: z.number().nullable()
});

export type Trend = z.infer<typeof trendSchema>;

export async function fetchPersonalizedTrends(): Promise<Trend[]> {
  const response = await fetch('/api/x/trends/personalized');
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.details || 'Failed to fetch personalized trends');
  }
  
  const data = await response.json();
  return z.array(trendSchema).parse(data);
}
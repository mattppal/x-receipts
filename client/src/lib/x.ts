import { z } from "zod";

const urlEntitySchema = z.object({
  urls: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      url: z.string(),
      expanded_url: z.string(),
      display_url: z.string(),
    }),
  ),
});

const descriptionEntitySchema = z.object({
  urls: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        url: z.string(),
        expanded_url: z.string(),
        display_url: z.string(),
      }),
    )
    .optional(),
  hashtags: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        tag: z.string(),
      }),
    )
    .optional(),
  mentions: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        tag: z.string().optional(),
      }),
    )
    .optional(),
  cashtags: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        tag: z.string(),
      }),
    )
    .optional(),
});

const pinnedTweetSchema = z.object({
  text: z.string(),
  created_at: z.string(),
  retweet_count: z.number(),
  reply_count: z.number(),
  like_count: z.number(),
  media: z.array(z.object({ key: z.string() })).optional(),
});

export const xUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  connection_status: z.array(z.string()).optional(),
  created_at: z.string(),
  description: z.string().optional(),
  entities: z
    .object({
      url: urlEntitySchema.optional(),
      description: descriptionEntitySchema.optional(),
    })
    .optional(),
  location: z.string().optional(),
  pinned_tweet_id: z.string().optional(),
  pinned_tweet: pinnedTweetSchema.optional(),
  profile_image_url: z.string().optional(),
  protected: z.boolean(),
  public_metrics: z.object({
    followers_count: z.number(),
    following_count: z.number(),
    tweet_count: z.number(),
    listed_count: z.number(),
    like_count: z.number(),
  }),
  url: z.string().optional(),
  verified_type: z.enum(['blue', 'business', 'government', 'none']).default('none'),
  withheld: z.object({}).optional(),
});

export type XUser = z.infer<typeof xUserSchema>;

export async function fetchXUser(username: string): Promise<XUser> {
  const response = await fetch(`/api/x/users/${username}`, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw {
      message: data.error || "Failed to fetch X user",
      details: data.details || "Unknown error occurred",
    };
  }

  return xUserSchema.parse(data);
}
INSERT INTO x_user_cache (username, data, cached_at) 
VALUES (
  'sampleuser',
  '{
    "id": "12345678",
    "name": "Sample User",
    "username": "sampleuser",
    "connection_status": ["following", "followed_by"],
    "created_at": "2020-01-01T00:00:00.000Z",
    "description": "This is a sample user for development purposes 👨‍💻",
    "entities": {
      "url": {
        "urls": [{
          "start": 0,
          "end": 23,
          "url": "https://example.com",
          "expanded_url": "https://example.com",
          "display_url": "example.com"
        }]
      },
      "description": {
        "hashtags": [{
          "start": 35,
          "end": 41,
          "tag": "coding"
        }],
        "mentions": [],
        "cashtags": []
      }
    },
    "location": "San Francisco, CA",
    "pinned_tweet_id": "123456789",
    "pinned_tweet": {
      "text": "This is a pinned tweet for testing purposes!",
      "created_at": "2023-01-01T00:00:00.000Z",
      "retweet_count": 42,
      "reply_count": 7,
      "like_count": 142,
      "media": [{"key": "media_1"}]
    },
    "profile_image_url": "https://pbs.twimg.com/profile_images/default_profile.png",
    "protected": false,
    "public_metrics": {
      "followers_count": 1337,
      "following_count": 420,
      "tweet_count": 2048,
      "listed_count": 12
    },
    "url": "https://example.com",
    "verified": true,
    "withheld": {}
  }',
  CURRENT_TIMESTAMP
);

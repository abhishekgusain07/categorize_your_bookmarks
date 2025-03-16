import { pgEnum, pgTable, serial, text, timestamp, uniqueIndex, boolean, integer } from "drizzle-orm/pg-core";

// Define category enum for typesafe categories
export const tweetCategoryEnum = pgEnum('tweet_category', [
  'tech',
  'life_advice',
  'marketing_advice',
  'better_engineer',
  'resources',
  'productivity',
  'finance',
  'wisdom',
  'perspective',
  'health',
  'food'
]);

// Table to track processed tweets
export const processedTweets = pgTable("processed_tweets", {
  id: text("id").primaryKey(), // Tweet ID from Twitter
  processedAt: timestamp("processed_at").defaultNow(),
  tweet_url: text("tweet_url"), // URL of the tweet
  category: tweetCategoryEnum("category"), // Category using the enum for type safety
});

  
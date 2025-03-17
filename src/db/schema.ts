import { pgEnum, pgTable, serial, text, timestamp, uniqueIndex, boolean, integer } from "drizzle-orm/pg-core";

// Define category enum for typesafe categories
export const tweetCategoryEnum = pgEnum('tweet_category', [
  'tech_news',           // Tech industry news, product launches, updates
  'programming',         // Coding, programming languages, development
  'ai_ml',               // AI, machine learning, data science
  'career_advice',       // Career growth, job hunting, workplace advice
  'personal_growth',     // Self-improvement, habits, mindset
  'marketing',           // Marketing strategies, growth, advertising
  'design',              // UI/UX, graphic design, creative work
  'startup',             // Startup advice, funding, entrepreneurship
  'productivity',        // Time management, tools, efficiency
  'finance',             // Investing, money management, economics
  'mental_models',       // Thinking frameworks, decision making
  'health_fitness',      // Physical health, exercise, nutrition
  'tools_resources',     // Useful tools, websites, apps, resources
  'tutorials',           // How-to guides, tutorials, educational content
  'inspiration',         // Motivational content, success stories
  'books',               // Book recommendations, summaries
  'philosophy',          // Deep thoughts, philosophical ideas
  'science',             // Scientific discoveries, research
  'future_trends'        // Future predictions, emerging trends
]);

// Table to track processed tweets
export const processedTweets = pgTable("processed_tweets", {
  id: text("id").primaryKey(), // Tweet ID from Twitter
  processedAt: timestamp("processed_at").defaultNow(),
  tweet_url: text("tweet_url"), // URL of the tweet
  category: tweetCategoryEnum("category"), // Category using the enum for type safety
  tweet_text: text("tweet_text"), // Store the actual tweet text for reference
});

  
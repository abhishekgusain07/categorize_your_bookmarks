ALTER TABLE "processed_tweets" ADD COLUMN "tweet_text" text;--> statement-breakpoint
ALTER TABLE "public"."processed_tweets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tweet_category";--> statement-breakpoint
CREATE TYPE "public"."tweet_category" AS ENUM('tech_news', 'programming', 'ai_ml', 'career_advice', 'personal_growth', 'marketing', 'design', 'startup', 'productivity', 'finance', 'mental_models', 'health_fitness', 'tools_resources', 'tutorials', 'inspiration', 'books', 'philosophy', 'science', 'future_trends');--> statement-breakpoint
ALTER TABLE "public"."processed_tweets" ALTER COLUMN "category" SET DATA TYPE "public"."tweet_category" USING "category"::"public"."tweet_category";
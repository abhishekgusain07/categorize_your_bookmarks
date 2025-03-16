CREATE TYPE "public"."tweet_category" AS ENUM('tech', 'life_advice', 'marketing_advice', 'productivity', 'finance', 'health', 'other');--> statement-breakpoint
ALTER TABLE "processed_tweets" ALTER COLUMN "category" SET DATA TYPE tweet_category;--> statement-breakpoint
ALTER TABLE "processed_tweets" ADD COLUMN "tweet_url" text;
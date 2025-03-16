ALTER TABLE "public"."processed_tweets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tweet_category";--> statement-breakpoint
CREATE TYPE "public"."tweet_category" AS ENUM('tech', 'life_advice', 'marketing_advice', 'better_engineer', 'resources', 'productivity', 'finance', 'wisdom', 'perspective', 'health', 'food');--> statement-breakpoint
ALTER TABLE "public"."processed_tweets" ALTER COLUMN "category" SET DATA TYPE "public"."tweet_category" USING "category"::"public"."tweet_category";
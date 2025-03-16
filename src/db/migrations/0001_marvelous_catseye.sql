CREATE TABLE "processed_tweets" (
	"id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp DEFAULT now(),
	"category" text
);
--> statement-breakpoint
DROP TABLE "invoices" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions_plans" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"invoice_id" text,
	"subscription_id" text,
	"amount_paid" text,
	"amount_due" text,
	"currency" text,
	"status" text,
	"email" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"plan_id" text,
	"name" text,
	"description" text,
	"amount" text,
	"currency" text,
	"interval" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"subscription_id" text,
	"stripe_user_id" text,
	"status" text,
	"start_date" text,
	"end_date" text,
	"plan_id" text,
	"default_payment_method_id" text,
	"email" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"email" text,
	"first_name" text,
	"last_name" text,
	"gender" text,
	"profile_image_url" text,
	"user_id" text,
	"subscription" text,
	"credits" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id")
);

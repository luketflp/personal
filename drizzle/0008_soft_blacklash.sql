CREATE TYPE "public"."finance_entry_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "finance_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "finance_entry_type" NOT NULL,
	"occurred_on" date NOT NULL,
	"tour" text NOT NULL,
	"description" text,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "finance_entries_occurred_on_idx" ON "finance_entries" USING btree ("occurred_on");
CREATE TYPE "public"."quote_event_type" AS ENUM('view', 'section', 'scroll', 'leave', 'print', 'site_click');--> statement-breakpoint
CREATE TABLE "quote_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"type" "quote_event_type" NOT NULL,
	"visitor_id" varchar(24) NOT NULL,
	"session_id" varchar(24) NOT NULL,
	"data" jsonb,
	"device" varchar(8),
	"browser" text,
	"os" text,
	"referrer_host" text,
	"country" varchar(2),
	"region" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_events_quote_created_at_idx" ON "quote_events" USING btree ("quote_id","created_at");--> statement-breakpoint
CREATE INDEX "quote_events_quote_session_idx" ON "quote_events" USING btree ("quote_id","session_id");
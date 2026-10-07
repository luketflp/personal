CREATE TYPE "public"."contract_status" AS ENUM('draft', 'sent', 'signed', 'void');--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid,
	"slug" varchar(24) NOT NULL,
	"code" varchar(16) NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"language" varchar(2) DEFAULT 'pt' NOT NULL,
	"quote_code" varchar(16),
	"customer_name" text NOT NULL,
	"customer_company" text,
	"customer_email" text,
	"currency" varchar(3) NOT NULL,
	"total_cents" integer NOT NULL,
	"body" text NOT NULL,
	"issuer_name" text NOT NULL,
	"issuer_document" text NOT NULL,
	"issuer_address" text NOT NULL,
	"sent_at" timestamp with time zone,
	"signer_name" text,
	"signer_document_type" varchar(8),
	"signer_document" text,
	"signer_address" text,
	"signer_ip" text,
	"signer_user_agent" text,
	"signed_at" timestamp with time zone,
	"signed_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_slug_idx" ON "contracts" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_code_idx" ON "contracts" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_quote_active_idx" ON "contracts" USING btree ("quote_id") WHERE "contracts"."status" <> 'void';--> statement-breakpoint
CREATE INDEX "contracts_created_at_idx" ON "contracts" USING btree ("created_at");
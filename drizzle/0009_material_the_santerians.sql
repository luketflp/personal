CREATE TYPE "public"."project_kind" AS ENUM('passeio', 'servico', 'outro');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "project_kind" DEFAULT 'passeio' NOT NULL,
	"color" varchar(7) DEFAULT '#059669' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_entries" ADD COLUMN "project_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_name_idx" ON "projects" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finance_entries_project_id_idx" ON "finance_entries" USING btree ("project_id");--> statement-breakpoint
INSERT INTO "projects" ("name", "color")
SELECT t.name,
  (ARRAY['#059669','#0284c7','#7c3aed','#d97706','#e11d48','#52525b'])[1 + (row_number() OVER (ORDER BY t.name) - 1)::int % 6]
FROM (
  SELECT DISTINCT ON (lower(trim("tour"))) trim("tour") AS name
  FROM "finance_entries"
  ORDER BY lower(trim("tour"))
) t;--> statement-breakpoint
UPDATE "finance_entries" e
SET "project_id" = p."id"
FROM "projects" p
WHERE lower(trim(e."tour")) = lower(p."name");
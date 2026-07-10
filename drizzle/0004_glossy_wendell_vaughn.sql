ALTER TABLE "quotes" ADD COLUMN "code" varchar(16);--> statement-breakpoint
WITH "numbered_quotes" AS (
	SELECT
		"id",
		'LA-' || EXTRACT(YEAR FROM "issue_date")::int || '-' ||
			LPAD(
				ROW_NUMBER() OVER (
					PARTITION BY EXTRACT(YEAR FROM "issue_date")::int
					ORDER BY "created_at" ASC, "id" ASC
				)::text,
				3,
				'0'
			) AS "code"
	FROM "quotes"
)
UPDATE "quotes"
SET "code" = "numbered_quotes"."code"
FROM "numbered_quotes"
WHERE "quotes"."id" = "numbered_quotes"."id";--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_code_idx" ON "quotes" USING btree ("code");

CREATE TABLE IF NOT EXISTS "greylist" (
  "id" serial PRIMARY KEY,
  "words" text[] DEFAULT '{}' NOT NULL,
  "user_id" varchar(255) DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL
);

ALTER TABLE "greylist" ADD COLUMN IF NOT EXISTS "words" text[] DEFAULT '{}' NOT NULL;
ALTER TABLE "greylist" ADD COLUMN IF NOT EXISTS "user_id" varchar(255) DEFAULT '' NOT NULL;
ALTER TABLE "greylist" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT NOW() NOT NULL;
ALTER TABLE "greylist" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT NOW() NOT NULL;

CREATE INDEX IF NOT EXISTS "greylist_user_id_idx" ON "greylist"("user_id");
CREATE INDEX IF NOT EXISTS "greylist_created_at_idx" ON "greylist"("created_at");

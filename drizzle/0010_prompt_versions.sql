CREATE TABLE IF NOT EXISTS "prompt_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "prompt_id" integer NOT NULL,
  "version_number" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "prompt_text" text NOT NULL,
  "negative_prompt" text DEFAULT '' NOT NULL,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "model" varchar(100) DEFAULT '' NOT NULL,
  "is_template" boolean DEFAULT false NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "rating" integer,
  "notes" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "prompt_versions_prompt_id_prompts_id_fk"
    FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "prompt_versions_prompt_id_idx" ON "prompt_versions" ("prompt_id");
CREATE INDEX IF NOT EXISTS "prompt_versions_created_at_idx" ON "prompt_versions" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_versions_prompt_version_unique" ON "prompt_versions" ("prompt_id", "version_number");
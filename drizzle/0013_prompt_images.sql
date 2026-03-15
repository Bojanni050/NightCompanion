ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "image_url" text DEFAULT '' NOT NULL;

ALTER TABLE "prompt_versions" ADD COLUMN IF NOT EXISTS "image_url" text DEFAULT '' NOT NULL;
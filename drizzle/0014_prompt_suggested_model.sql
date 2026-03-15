ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "suggested_model" varchar(100) DEFAULT '' NOT NULL;

ALTER TABLE "prompt_versions" ADD COLUMN IF NOT EXISTS "suggested_model" varchar(100) DEFAULT '' NOT NULL;
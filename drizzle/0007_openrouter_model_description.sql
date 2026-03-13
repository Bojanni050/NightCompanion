ALTER TABLE "openrouter_models"
  ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
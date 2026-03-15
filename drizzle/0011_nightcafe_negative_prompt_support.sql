ALTER TABLE "nightcafe_models"
ADD COLUMN IF NOT EXISTS "supports_negative_prompt" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "nightcafe_models"
SET "supports_negative_prompt" = (
  lower(coalesce("model_name", '') || ' ' || coalesce("description", '')) LIKE '%coherent%'
  OR lower(coalesce("model_name", '') || ' ' || coalesce("description", '')) LIKE '%artistic%'
  OR lower(coalesce("model_name", '') || ' ' || coalesce("description", '')) LIKE '%stable diffusion%'
  OR lower(coalesce("model_name", '') || ' ' || coalesce("description", '')) LIKE '%sdxl%'
  OR lower(coalesce("model_name", '') || ' ' || coalesce("description", '')) LIKE '%checkpoint%'
  OR (coalesce("model_name", '') || ' ' || coalesce("description", '')) ~* '(^|[^a-z0-9])sd\s*(1\.4|1\.5|xl|[0-9])'
);

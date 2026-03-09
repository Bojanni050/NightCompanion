CREATE TABLE IF NOT EXISTS "openrouter_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "model_id" varchar(255) NOT NULL,
  "display_name" varchar(255) NOT NULL,
  "context_length" integer,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "openrouter_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openrouter_models_model_id_idx" ON "openrouter_models" USING btree ("model_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "openrouter_models_updated_at_idx" ON "openrouter_models" USING btree ("updated_at");

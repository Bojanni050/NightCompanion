CREATE TABLE IF NOT EXISTS "ai_configuration_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "singleton_key" varchar(32) DEFAULT 'singleton' NOT NULL,
  "open_router" jsonb DEFAULT '{"apiKey":"","model":"openai/gpt-4o-mini","siteUrl":"","appName":"NightCompanion"}'::jsonb NOT NULL,
  "provider_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "local_endpoints" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "ai_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_configuration_settings_singleton_key_unique"
  ON "ai_configuration_settings" ("singleton_key");

CREATE INDEX IF NOT EXISTS "ai_configuration_settings_updated_at_idx"
  ON "ai_configuration_settings" ("updated_at");

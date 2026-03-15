ALTER TABLE "nightcafe_models"
  ADD COLUMN "hf_model_id" varchar(255),
  ADD COLUMN "hf_card_summary" text DEFAULT '' NOT NULL,
  ADD COLUMN "hf_downloads" integer,
  ADD COLUMN "hf_likes" integer,
  ADD COLUMN "hf_last_modified" timestamp,
  ADD COLUMN "hf_synced_at" timestamp,
  ADD COLUMN "hf_sync_status" varchar(24) DEFAULT 'pending' NOT NULL;

ALTER TABLE "greylist" ADD COLUMN IF NOT EXISTS "entries_json" jsonb DEFAULT '[]'::jsonb NOT NULL;

UPDATE "greylist"
SET "entries_json" = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('word', w, 'weight', 1)),
    '[]'::jsonb
  )
  FROM unnest("words") AS w
)
WHERE "entries_json" = '[]'::jsonb;

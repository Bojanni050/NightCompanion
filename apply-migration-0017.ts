import 'dotenv/config'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nightcompanion'

async function applyMigration() {
  const client = postgres(connectionString, { max: 1 })
  
  try {
    console.log('Applying migration 0017: Add preset_prompt column...')
    await client.unsafe(`ALTER TABLE "nightcafe_presets" ADD COLUMN IF NOT EXISTS "preset_prompt" text DEFAULT '' NOT NULL`)
    console.log('Migration applied successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigration().then(() => process.exit(0))

import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nightcompanion'

async function applyGreylistMigration() {
  const client = postgres(connectionString, { max: 1 })
  
  try {
    console.log('Creating greylist table...')
    await client.unsafe(`CREATE TABLE IF NOT EXISTS "greylist" (id serial PRIMARY KEY, words text[] DEFAULT '{}' NOT NULL, user_id varchar(255) DEFAULT '' NOT NULL, created_at timestamp DEFAULT NOW() NOT NULL, updated_at timestamp DEFAULT NOW() NOT NULL)`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS "greylist_user_id_idx" ON "greylist"("user_id")`)
    await client.unsafe(`CREATE INDEX IF NOT EXISTS "greylist_created_at_idx" ON "greylist"("created_at")`)
    console.log('Greylist table created successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyGreylistMigration().then(() => process.exit(0))

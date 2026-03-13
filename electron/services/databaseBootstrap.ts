import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function getDatabaseNameFromUrl(connectionUrl: string) {
  const parsed = new URL(connectionUrl)
  const dbName = parsed.pathname.replace(/^\//, '')

  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name in the path')
  }

  return dbName
}

function getAdminConnectionString(connectionUrl: string) {
  const parsed = new URL(connectionUrl)
  parsed.pathname = '/postgres'
  return parsed.toString()
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

function isPostgresUnavailableError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? String((error as { code?: string }).code) : ''
  return code === 'CONNECTION_REFUSED' || code === 'CONNECT_TIMEOUT' || code === 'ECONNREFUSED'
}

export async function ensurePostgresAndDatabase(connectionString: string) {
  const dbName = getDatabaseNameFromUrl(connectionString)
  const adminConnectionString = getAdminConnectionString(connectionString)
  const adminClient = postgres(adminConnectionString, { max: 1, connect_timeout: 5 })

  try {
    await adminClient`SELECT 1`

    const existing = await adminClient`
      SELECT 1
      FROM pg_database
      WHERE datname = ${dbName}
      LIMIT 1
    `

    if (existing.length > 0) {
      console.log(`Database "${dbName}" exists.`)
      return
    }

    console.log(`Database "${dbName}" not found. Creating...`)
    await adminClient.unsafe(`CREATE DATABASE ${quoteIdentifier(dbName)}`)
    console.log(`Database "${dbName}" created.`)
  } catch (error) {
    if (isPostgresUnavailableError(error)) {
      throw new Error(`PostgreSQL is not running or unreachable. Start PostgreSQL and retry. (${toErrorMessage(error)})`)
    }

    throw error
  } finally {
    await adminClient.end()
  }
}

export async function runMigrations(connectionString: string, migrationsFolder: string) {
  const migrateClient = postgres(connectionString, { max: 1 })
  const migrateDb = drizzle(migrateClient)

  try {
    await migrate(migrateDb, { migrationsFolder })
  } finally {
    await migrateClient.end()
  }
}

export function formatErrorMessage(error: unknown) {
  return toErrorMessage(error)
}
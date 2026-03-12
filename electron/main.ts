import 'dotenv/config'
import { app, BrowserWindow, dialog, shell } from 'electron'
import path from 'path'
import { mkdirSync } from 'fs'
import { readFile } from 'fs/promises'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { notInArray } from 'drizzle-orm'
import * as schema from '../src/lib/schema'
import { nightcafeModels, nightcafePresets } from '../src/lib/schema'
import { registerPromptsIpc } from './ipc/prompts'
import { registerStyleProfilesIpc } from './ipc/styleProfiles'
import { registerGenerationLogIpc } from './ipc/generationLog'
import { registerNightCafeIpc } from './ipc/nightcafe'
import { registerCharactersIpc } from './ipc/characters'
import { getOpenRouterSettings, registerSettingsIpc } from './ipc/settings'
import { registerAiIpc } from './ipc/ai'

const sessionDataPath = path.join(app.getPath('temp'), 'NightCompanion', 'session-data')
try {
  mkdirSync(sessionDataPath, { recursive: true })
  app.setPath('sessionData', sessionDataPath)
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
} catch (error) {
  console.warn('Could not set custom sessionData path:', error)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set — create a .env file from .env.example')
  app.quit()
  process.exit(1)
}

const queryClient = postgres(connectionString)
const db = drizzle(queryClient, { schema })

const NIGHTCAFE_MODELS_FILE = 'nightcafe_models_compleet.csv'
const NIGHTCAFE_PRESETS_FILE = 'nightcafe_presets.csv'

async function runMigrations() {
  const migrateClient = postgres(connectionString!, { max: 1 })
  const migrateDb = drizzle(migrateClient)
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(app.getAppPath(), 'drizzle')

  await migrate(migrateDb, { migrationsFolder })
  await migrateClient.end()
}

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

async function ensurePostgresAndDatabase() {
  const dbName = getDatabaseNameFromUrl(connectionString!)
  const adminConnectionString = getAdminConnectionString(connectionString!)
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

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050810',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5187')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function getNightCafeModelsCandidates() {
  const candidates = [
    path.join(app.getAppPath(), 'resources', 'models', NIGHTCAFE_MODELS_FILE),
    path.join(process.resourcesPath, 'models', NIGHTCAFE_MODELS_FILE),
    path.join(process.resourcesPath, 'resources', 'models', NIGHTCAFE_MODELS_FILE),
  ]

  return [...new Set(candidates)]
}

function getNightCafePresetsCandidates() {
  const candidates = [
    path.join(app.getAppPath(), 'resources', 'presets', NIGHTCAFE_PRESETS_FILE),
    path.join(process.resourcesPath, 'presets', NIGHTCAFE_PRESETS_FILE),
    path.join(process.resourcesPath, 'resources', 'presets', NIGHTCAFE_PRESETS_FILE),
  ]

  return [...new Set(candidates)]
}

async function readNightCafeModelsCsv() {
  const candidates = getNightCafeModelsCandidates()

  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf-8')
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') continue
      throw error
    }
  }

  throw new Error(`NightCafe model file not found. Looked in: ${candidates.join(', ')}`)
}

async function readNightCafePresetsCsv() {
  const candidates = getNightCafePresetsCandidates()

  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf-8')
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') continue
      throw error
    }
  }

  throw new Error(`NightCafe presets file not found. Looked in: ${candidates.join(', ')}`)
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function normalizeNightCafeModelType(raw: string) {
  const value = raw.trim().toLowerCase()
  if (value.includes('video')) return 'video' as const
  if (value.includes('edit')) return 'edit' as const
  if (value.includes('image')) return 'image' as const
  return 'unknown' as const
}

function makeModelKey(name: string, modelType: string) {
  return `${name.trim().toLowerCase()}::${modelType}`
}

function parseNightCafeModelsCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    throw new Error('NightCafe model CSV has no data rows.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^\uFEFF/, ''))
  const rows = lines.slice(1)

  const byKey = new Map<string, {
    modelKey: string
    modelName: string
    description: string
    modelType: string
    mediaType: string
    artScore: string
    promptingScore: string
    realismScore: string
    typographyScore: string
    costTier: string
    updatedAt: Date
  }>()

  for (const row of rows) {
    const cells = parseCsvLine(row)
    if (cells.length === 0) continue

    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ''
    })

    const modelName = (record.Model || '').trim()
    if (!modelName) continue

    const modelType = normalizeNightCafeModelType(record.Type || '')
    const mediaType = modelType === 'video' ? 'video' : 'image'
    const modelKey = makeModelKey(modelName, modelType)

    byKey.set(modelKey, {
      modelKey,
      modelName,
      description: (record.Beschrijving || '').trim(),
      modelType,
      mediaType,
      artScore: (record['Art (★)'] || '').trim(),
      promptingScore: (record['Prompting (★)'] || '').trim(),
      realismScore: (record['Realism (★)'] || '').trim(),
      typographyScore: (record['Typography (★)'] || '').trim(),
      costTier: (record['Kosten ($)'] || '').trim(),
      updatedAt: new Date(),
    })
  }

  return [...byKey.values()]
}

async function syncNightCafeModelsFromCsv() {
  const csv = await readNightCafeModelsCsv()
  const rows = parseNightCafeModelsCsv(csv)

  if (rows.length === 0) {
    throw new Error('NightCafe model CSV parsed but produced zero models.')
  }

  for (const row of rows) {
    await db
      .insert(nightcafeModels)
      .values(row)
      .onConflictDoUpdate({
        target: nightcafeModels.modelKey,
        set: {
          modelName: row.modelName,
          description: row.description,
          modelType: row.modelType,
          mediaType: row.mediaType,
          artScore: row.artScore,
          promptingScore: row.promptingScore,
          realismScore: row.realismScore,
          typographyScore: row.typographyScore,
          costTier: row.costTier,
          updatedAt: new Date(),
        },
      })
  }

  const validKeys = rows.map((row) => row.modelKey)
  if (validKeys.length > 0) {
    await db.delete(nightcafeModels).where(notInArray(nightcafeModels.modelKey, validKeys))
  }

  const imageCount = rows.filter((row) => row.mediaType === 'image').length
  const videoCount = rows.filter((row) => row.mediaType === 'video').length
  console.log(`NightCafe models synced: ${rows.length} total (${imageCount} image, ${videoCount} video)`)
}

function parseNightCafePresetsCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    throw new Error('NightCafe presets CSV has no data rows.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^\uFEFF/, ''))
  const rows = lines.slice(1)

  const byKey = new Map<string, {
    presetKey: string
    presetName: string
    category: string
    gridRow: number | null
    gridColumn: number | null
    updatedAt: Date
  }>()

  for (const row of rows) {
    const cells = parseCsvLine(row)
    if (cells.length === 0) continue

    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ''
    })

    const presetName = (record['Preset Name'] || '').trim()
    if (!presetName) continue

    const category = (record.Category || '').trim()
    const gridRow = Number.parseInt(record.Row || '', 10)
    const gridColumn = Number.parseInt(record.Column || '', 10)
    const presetKey = presetName.toLowerCase()

    byKey.set(presetKey, {
      presetKey,
      presetName,
      category,
      gridRow: Number.isNaN(gridRow) ? null : gridRow,
      gridColumn: Number.isNaN(gridColumn) ? null : gridColumn,
      updatedAt: new Date(),
    })
  }

  return [...byKey.values()]
}

async function syncNightCafePresetsFromCsv() {
  const csv = await readNightCafePresetsCsv()
  const rows = parseNightCafePresetsCsv(csv)

  if (rows.length === 0) {
    throw new Error('NightCafe presets CSV parsed but produced zero presets.')
  }

  for (const row of rows) {
    await db
      .insert(nightcafePresets)
      .values(row)
      .onConflictDoUpdate({
        target: nightcafePresets.presetKey,
        set: {
          presetName: row.presetName,
          category: row.category,
          gridRow: row.gridRow,
          gridColumn: row.gridColumn,
          updatedAt: new Date(),
        },
      })
  }

  const validKeys = rows.map((row) => row.presetKey)
  if (validKeys.length > 0) {
    await db.delete(nightcafePresets).where(notInArray(nightcafePresets.presetKey, validKeys))
  }

  console.log(`NightCafe presets synced: ${rows.length} total`)
}

function registerIpcHandlers() {
  registerPromptsIpc({ db })
  registerStyleProfilesIpc({ db })
  registerGenerationLogIpc({ db })
  registerNightCafeIpc({ db })
  registerCharactersIpc({ db })
  registerSettingsIpc({ db })
  registerAiIpc({ getOpenRouterSettings })
}

app.whenReady().then(async () => {
  try {
    await ensurePostgresAndDatabase()
    await runMigrations()
    console.log('Database ready.')
  } catch (err) {
    const errorMessage = toErrorMessage(err)
    console.error('Startup database check failed:', err)
    dialog.showErrorBox(
      'NightCompanion startup error',
      `Database startup check failed.\n\n${errorMessage}\n\nIf PostgreSQL is running, verify DATABASE_URL and user permissions.`
    )
    app.quit()
    process.exit(1)
    return
  }

  try {
    await syncNightCafeModelsFromCsv()
  } catch (err) {
    console.error('Failed to sync NightCafe models:', err)
  }

  try {
    await syncNightCafePresetsFromCsv()
  } catch (err) {
    console.error('Failed to sync NightCafe presets:', err)
  }

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await queryClient.end()
  if (process.platform !== 'darwin') app.quit()
})

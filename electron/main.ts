import 'dotenv/config'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm'
import * as schema from '../src/lib/schema'
import { prompts, styleProfiles, generationLog } from '../src/lib/schema'
import type { NewPrompt, NewStyleProfile, NewGenerationEntry } from '../src/lib/schema'

// ─── Database ─────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set — create a .env file from .env.example')
  app.quit()
  process.exit(1)
}

const queryClient = postgres(connectionString)
const db = drizzle(queryClient, { schema })

async function runMigrations() {
  const migrateClient = postgres(connectionString!, { max: 1 })
  const migrateDb = drizzle(migrateClient)
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(__dirname, '..', 'drizzle')

  await migrate(migrateDb, { migrationsFolder })
  await migrateClient.end()
}

// ─── Window ───────────────────────────────────────────────────────────────────

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
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ─── IPC: Prompts ─────────────────────────────────────────────────────────────

type PromptFilters = { search?: string; tags?: string[]; model?: string }

ipcMain.handle('prompts:list', async (_, filters: PromptFilters = {}) => {
  try {
    const { search, tags, model } = filters
    const conditions = []

    if (search && search.trim()) {
      conditions.push(
        or(
          ilike(prompts.title, `%${search.trim()}%`),
          ilike(prompts.promptText, `%${search.trim()}%`)
        )
      )
    }
    if (model && model.trim()) {
      conditions.push(eq(prompts.model, model.trim()))
    }
    if (tags && tags.length > 0) {
      const tagValues = tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ')
      conditions.push(sql`${prompts.tags} @> ARRAY[${sql.raw(tagValues)}]::text[]`)
    }

    const data = await db
      .select()
      .from(prompts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(prompts.createdAt))

    return { data }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('prompts:get', async (_, id: number) => {
  try {
    const [data] = await db.select().from(prompts).where(eq(prompts.id, id))
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('prompts:create', async (_, data: NewPrompt) => {
  try {
    const [created] = await db
      .insert(prompts)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning()
    return { data: created }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('prompts:update', async (_, id: number, data: Partial<NewPrompt>) => {
  try {
    const [updated] = await db
      .update(prompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prompts.id, id))
      .returning()
    return { data: updated }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('prompts:delete', async (_, id: number) => {
  try {
    await db.delete(prompts).where(eq(prompts.id, id))
    return { data: undefined }
  } catch (error) {
    return { error: String(error) }
  }
})

// ─── IPC: Style Profiles ──────────────────────────────────────────────────────

ipcMain.handle('styleProfiles:list', async () => {
  try {
    const data = await db
      .select()
      .from(styleProfiles)
      .orderBy(desc(styleProfiles.createdAt))
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('styleProfiles:get', async (_, id: number) => {
  try {
    const [data] = await db.select().from(styleProfiles).where(eq(styleProfiles.id, id))
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('styleProfiles:create', async (_, data: NewStyleProfile) => {
  try {
    const [created] = await db
      .insert(styleProfiles)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning()
    return { data: created }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('styleProfiles:update', async (_, id: number, data: Partial<NewStyleProfile>) => {
  try {
    const [updated] = await db
      .update(styleProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(styleProfiles.id, id))
      .returning()
    return { data: updated }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('styleProfiles:delete', async (_, id: number) => {
  try {
    await db.delete(styleProfiles).where(eq(styleProfiles.id, id))
    return { data: undefined }
  } catch (error) {
    return { error: String(error) }
  }
})

// ─── IPC: Generation Log ──────────────────────────────────────────────────────

ipcMain.handle('generationLog:list', async () => {
  try {
    const data = await db
      .select()
      .from(generationLog)
      .orderBy(desc(generationLog.createdAt))
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('generationLog:create', async (_, data: NewGenerationEntry) => {
  try {
    const [created] = await db
      .insert(generationLog)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning()
    return { data: created }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('generationLog:update', async (_, id: number, data: Partial<NewGenerationEntry>) => {
  try {
    const [updated] = await db
      .update(generationLog)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(generationLog.id, id))
      .returning()
    return { data: updated }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('generationLog:delete', async (_, id: number) => {
  try {
    await db.delete(generationLog).where(eq(generationLog.id, id))
    return { data: undefined }
  } catch (error) {
    return { error: String(error) }
  }
})

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    await runMigrations()
    console.log('Database ready.')
  } catch (err) {
    console.error('Failed to run migrations:', err)
    // Continue anyway — DB may already be migrated
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await queryClient.end()
  if (process.platform !== 'darwin') app.quit()
})

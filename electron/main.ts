import 'dotenv/config'
import { app, BrowserWindow, dialog } from 'electron'
import path from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/lib/schema'
import { registerPromptsIpc } from './ipc/prompts'
import { registerStyleProfilesIpc } from './ipc/styleProfiles'
import { registerGenerationLogIpc } from './ipc/generationLog'
import { registerNightCafeIpc } from './ipc/nightcafe'
import { registerCharactersIpc } from './ipc/characters'
import { getAiApiRequestLoggingEnabled, getOpenRouterSettings, registerSettingsIpc } from './ipc/settings'
import { registerAiIpc } from './ipc/ai'
import { syncNightCafeData } from './services/nightcafeSync'
import { ensurePostgresAndDatabase, formatErrorMessage, runMigrations } from './services/databaseBootstrap'
import { createMainWindow } from './services/windowManager'
import { configureAppEnvironment } from './services/appEnvironment'

configureAppEnvironment()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set — create a .env file from .env.example')
  app.quit()
  process.exit(1)
}

const queryClient = postgres(connectionString)
const db = drizzle(queryClient, { schema })

function registerIpcHandlers() {
  registerPromptsIpc({ db })
  registerStyleProfilesIpc({ db })
  registerGenerationLogIpc({ db })
  registerNightCafeIpc({ db })
  registerCharactersIpc({ db })
  registerSettingsIpc({ db })
  registerAiIpc({ getOpenRouterSettings, getAiApiRequestLoggingEnabled })
}

app.whenReady().then(async () => {
  try {
    await ensurePostgresAndDatabase(connectionString)
    const migrationsFolder = app.isPackaged
      ? path.join(process.resourcesPath, 'drizzle')
      : path.join(app.getAppPath(), 'drizzle')
    await runMigrations(connectionString, migrationsFolder)
    console.log('Database ready.')
  } catch (err) {
    const errorMessage = formatErrorMessage(err)
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
    await syncNightCafeData({ db })
  } catch (err) {
    console.error('Failed to sync NightCafe data:', err)
  }

  registerIpcHandlers()
  createMainWindow({
    isPackaged: app.isPackaged,
    preloadPath: path.join(__dirname, 'preload.js'),
    devUrl: 'http://localhost:5187',
    prodIndexPath: path.join(__dirname, '..', 'dist-renderer', 'index.html'),
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow({
        isPackaged: app.isPackaged,
        preloadPath: path.join(__dirname, 'preload.js'),
        devUrl: 'http://localhost:5187',
        prodIndexPath: path.join(__dirname, '..', 'dist-renderer', 'index.html'),
      })
    }
  })
})

app.on('window-all-closed', async () => {
  await queryClient.end()
  if (process.platform !== 'darwin') app.quit()
})

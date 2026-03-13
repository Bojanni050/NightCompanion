import { app } from 'electron'
import path from 'path'
import { mkdirSync } from 'fs'

export function configureAppEnvironment() {
  const sessionDataPath = path.join(app.getPath('temp'), 'NightCompanion', 'session-data')

  try {
    mkdirSync(sessionDataPath, { recursive: true })
    app.setPath('sessionData', sessionDataPath)
    app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
  } catch (error) {
    console.warn('Could not set custom sessionData path:', error)
  }
}
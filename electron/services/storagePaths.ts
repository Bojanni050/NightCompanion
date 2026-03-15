import { app } from 'electron'
import path from 'path'
import { readFileSync } from 'fs'

type StoredSettings = {
  aiConfig?: {
    nightCompanionFolderPath?: string
  }
}

function getSettingsFilePath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function getDefaultNightCompanionFolderPath() {
  const localAppData = process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local')
  return path.join(localAppData, 'NightCompanion')
}

export function getLegacyNightCompanionFolderPath() {
  return path.join(app.getPath('home'), 'NightCompanion')
}

export function getConfiguredNightCompanionFolderPath() {
  try {
    const raw = readFileSync(getSettingsFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as StoredSettings
    const configured = parsed.aiConfig?.nightCompanionFolderPath

    if (typeof configured === 'string' && configured.trim()) {
      return path.resolve(configured.trim())
    }
  } catch {
    // ignore and fallback to default
  }

  return path.resolve(getDefaultNightCompanionFolderPath())
}

export function resolveNightCompanionSubdir(...segments: string[]) {
  return path.join(getConfiguredNightCompanionFolderPath(), ...segments)
}

export function getManagedNightCompanionRoots() {
  const roots = [
    path.resolve(getConfiguredNightCompanionFolderPath()),
    path.resolve(getDefaultNightCompanionFolderPath()),
    path.resolve(getLegacyNightCompanionFolderPath()),
  ]

  return [...new Set(roots)]
}

export function isPathWithin(parentPath: string, targetPath: string) {
  const normalizedParent = path.resolve(parentPath)
  const normalizedTarget = path.resolve(targetPath)

  const parentWithSep = normalizedParent.endsWith(path.sep)
    ? normalizedParent
    : `${normalizedParent}${path.sep}`

  if (process.platform === 'win32') {
    return normalizedTarget.toLowerCase().startsWith(parentWithSep.toLowerCase())
  }

  return normalizedTarget.startsWith(parentWithSep)
}

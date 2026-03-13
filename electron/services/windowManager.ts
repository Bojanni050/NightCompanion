import { BrowserWindow, shell } from 'electron'

type CreateMainWindowInput = {
  isPackaged: boolean
  preloadPath: string
  devUrl: string
  prodIndexPath: string
}

export function createMainWindow({ isPackaged, preloadPath, devUrl, prodIndexPath }: CreateMainWindowInput) {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050810',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development' || !isPackaged) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(prodIndexPath)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}
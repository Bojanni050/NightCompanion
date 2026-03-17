// Dialog IPC handlers for native Electron dialogs
import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron'

export function registerDialogHandlers() {
  ipcMain.handle('dialog:showErrorBox', async (_event: IpcMainInvokeEvent, { title, content }: { title: string; content: string }) => {
    dialog.showErrorBox(title, content)
  })

  ipcMain.handle('dialog:showMessageBox', async (_event: IpcMainInvokeEvent, options: { type?: 'info' | 'warning' | 'error'; title: string; message: string; buttons?: string[] }) => {
    const result = await dialog.showMessageBox({
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      buttons: options.buttons || ['OK'],
      noLink: true,
    })
    return { response: result.response, checkboxChecked: result.checkboxChecked }
  })
}

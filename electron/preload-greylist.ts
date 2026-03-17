import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing API
  greylist: {
    get: () => ipcRenderer.invoke('greylist:get'),
    save: (data: { words: string[] }) => ipcRenderer.invoke('greylist:save', data),
    update: (data: { words: string[] }) => ipcRenderer.invoke('greylist:update', data),
  },
})

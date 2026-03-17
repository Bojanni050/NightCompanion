import { ipcRenderer } from 'electron'
import type { Greylist } from '../lib/schema'

export async function getGreylist(): Promise<Greylist | null> {
  const result = await ipcRenderer.invoke('greylist:get')
  return result.data || null
}

export async function saveGreylist(words: string[]): Promise<void> {
  await ipcRenderer.invoke('greylist:save', { words })
}

export async function updateGreylist(words: string[]): Promise<void> {
  await ipcRenderer.invoke('greylist:update', { words })
}

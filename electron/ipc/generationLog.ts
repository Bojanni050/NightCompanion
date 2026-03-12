import { ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, desc } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { generationLog } from '../../src/lib/schema'
import type { NewGenerationEntry } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

export function registerGenerationLogIpc({ db }: { db: Database }) {
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
}

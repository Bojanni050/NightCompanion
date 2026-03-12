import { ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, desc } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { styleProfiles } from '../../src/lib/schema'
import type { NewStyleProfile } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

export function registerStyleProfilesIpc({ db }: { db: Database }) {
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
}

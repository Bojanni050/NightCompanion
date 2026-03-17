import { app, ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { greylistTable } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

export function registerGreylistHandlers(db: Database) {
  ipcMain.handle('greylist:get', async () => {
    try {
      const greylist = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: greylist[0] || null }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get greylist' }
    }
  })

  ipcMain.handle('greylist:save', async (_, { words }: { words: string[] }) => {
    try {
      const existing = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      
      if (existing[0]) {
        await db.update(greylistTable)
          .set({ words, updatedAt: new Date() })
          .where(eq(greylistTable.userId, ''))
      } else {
        await db.insert(greylistTable).values({
          words,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      
      const updated = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: updated[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save greylist' }
    }
  })

  ipcMain.handle('greylist:update', async (_, { words }: { words: string[] }) => {
    try {
      await db.update(greylistTable)
        .set({ words, updatedAt: new Date() })
        .where(eq(greylistTable.userId, ''))
      
      const updated = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: updated[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update greylist' }
    }
  })
}

import { app, ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { greylistTable } from '../../src/lib/schema'

export function registerGreylistHandlers(db: any) {
  const drizzleDb = drizzle(db, { schema })

  ipcMain.handle('greylist:get', async () => {
    try {
      const greylist = await drizzleDb.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: greylist[0] || null }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get greylist' }
    }
  })

  ipcMain.handle('greylist:save', async (_, { words }: { words: string[] }) => {
    try {
      const existing = await drizzleDb.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      
      if (existing[0]) {
        await drizzleDb.update(greylistTable)
          .set({ words, updatedAt: new Date() })
          .where(eq(greylistTable.userId, ''))
      } else {
        await drizzleDb.insert(greylistTable).values({
          words,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      
      const updated = await drizzleDb.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: updated[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save greylist' }
    }
  })

  ipcMain.handle('greylist:update', async (_, { words }: { words: string[] }) => {
    try {
      await drizzleDb.update(greylistTable)
        .set({ words, updatedAt: new Date() })
        .where(eq(greylistTable.userId, ''))
      
      const updated = await drizzleDb.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      return { success: true, data: updated[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update greylist' }
    }
  })
}

import { ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { prompts, promptVersions } from '../../src/lib/schema'
import type { NewPrompt } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>
type PromptFilters = { search?: string; tags?: string[]; model?: string }

export function registerPromptsIpc({ db }: { db: Database }) {
  ipcMain.handle('prompts:list', async (_, filters: PromptFilters = {}) => {
    try {
      const { search, tags, model } = filters
      const conditions = []

      if (search && search.trim()) {
        conditions.push(
          or(
            ilike(prompts.title, `%${search.trim()}%`),
            ilike(prompts.promptText, `%${search.trim()}%`)
          )
        )
      }
      if (model && model.trim()) {
        conditions.push(eq(prompts.model, model.trim()))
      }
      if (tags && tags.length > 0) {
        const tagValues = tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ')
        conditions.push(sql`${prompts.tags} @> ARRAY[${sql.raw(tagValues)}]::text[]`)
      }

      const data = await db
        .select()
        .from(prompts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(prompts.createdAt))

      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('prompts:get', async (_, id: number) => {
    try {
      const [data] = await db.select().from(prompts).where(eq(prompts.id, id))
      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('prompts:create', async (_, data: NewPrompt) => {
    try {
      const [created] = await db
        .insert(prompts)
        .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
        .returning()
      return { data: created }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('prompts:listVersions', async (_, promptId: number) => {
    try {
      const data = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.promptId, promptId))
        .orderBy(desc(promptVersions.versionNumber))

      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('prompts:update', async (_, id: number, data: Partial<NewPrompt>) => {
    try {
      const updated = await db.transaction(async (tx) => {
        const [current] = await tx.select().from(prompts).where(eq(prompts.id, id))
        if (!current) throw new Error(`Prompt with id ${id} not found.`)

        const [versionCounter] = await tx
          .select({
            maxVersion: sql<number>`coalesce(max(${promptVersions.versionNumber}), 0)`,
          })
          .from(promptVersions)
          .where(eq(promptVersions.promptId, id))

        const nextVersionNumber = (versionCounter?.maxVersion ?? 0) + 1

        await tx.insert(promptVersions).values({
          promptId: current.id,
          versionNumber: nextVersionNumber,
          title: current.title,
          promptText: current.promptText,
          negativePrompt: current.negativePrompt ?? '',
          tags: current.tags,
          model: current.model,
          isTemplate: current.isTemplate,
          isFavorite: current.isFavorite,
          rating: current.rating,
          notes: current.notes ?? '',
          createdAt: new Date(),
        })

        const [next] = await tx
          .update(prompts)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(prompts.id, id))
          .returning()

        return next
      })

      return { data: updated }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('prompts:delete', async (_, id: number) => {
    try {
      await db.delete(prompts).where(eq(prompts.id, id))
      return { data: undefined }
    } catch (error) {
      return { error: String(error) }
    }
  })
}

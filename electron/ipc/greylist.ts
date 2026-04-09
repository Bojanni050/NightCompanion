import { ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { greylistTable } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

type GreylistEntry = { word: string; weight: 1 | 2 | 3 | 4 | 5 }

function normalizeEntry(input: GreylistEntry): GreylistEntry | null {
  const word = input.word.trim().toLowerCase()
  if (!word) return null
  const weight = Math.max(1, Math.min(5, input.weight)) as 1 | 2 | 3 | 4 | 5
  return { word, weight }
}

function mergeEntries(entries: GreylistEntry[]): GreylistEntry[] {
  const map = new Map<string, GreylistEntry>()
  for (const entry of entries) {
    const normalized = normalizeEntry(entry)
    if (!normalized) continue
    map.set(normalized.word, normalized)
  }
  return Array.from(map.values()).sort((a, b) => a.word.localeCompare(b.word))
}

function buildEntriesFromWords(words: string[]): GreylistEntry[] {
  return mergeEntries(words.map((word) => ({ word, weight: 1 })))
}

export function registerGreylistHandlers(db: Database) {
  ipcMain.handle('greylist:get', async () => {
    try {
      const greylist = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)
      const record = greylist[0] || null

      if (!record) return { data: null }

      const entries = Array.isArray(record.entriesJson) && record.entriesJson.length > 0
        ? mergeEntries(record.entriesJson as GreylistEntry[])
        : buildEntriesFromWords(record.words ?? [])

      return {
        data: {
          ...record,
          words: entries.map((e) => e.word),
          entriesJson: entries,
        },
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to get greylist' }
    }
  })

  ipcMain.handle(
    'greylist:save',
    async (_, { words, entriesJson }: { words?: string[]; entriesJson?: GreylistEntry[] }) => {
      try {
        const existing = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)

        const entries = Array.isArray(entriesJson) && entriesJson.length > 0
          ? mergeEntries(entriesJson)
          : buildEntriesFromWords(words ?? [])
        const storedWords = entries.map((e) => e.word)

        if (existing[0]) {
          await db.update(greylistTable)
            .set({
              words: storedWords,
              entriesJson: entries,
              updatedAt: new Date(),
            })
            .where(eq(greylistTable.userId, ''))
        } else {
          await db.insert(greylistTable).values({
            words: storedWords,
            entriesJson: entries,
            userId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }

        const updated = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)

        const record = updated[0]
        if (!record) return { data: null }

        return {
          data: {
            ...record,
            words: storedWords,
            entriesJson: entries,
          },
        }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to save greylist' }
      }
    }
  )

  ipcMain.handle(
    'greylist:update',
    async (_, { words, entriesJson }: { words?: string[]; entriesJson?: GreylistEntry[] }) => {
      try {
        const entries = Array.isArray(entriesJson) && entriesJson.length > 0
          ? mergeEntries(entriesJson)
          : buildEntriesFromWords(words ?? [])
        const storedWords = entries.map((e) => e.word)

        await db.update(greylistTable)
          .set({
            words: storedWords,
            entriesJson: entries,
            updatedAt: new Date(),
          })
          .where(eq(greylistTable.userId, ''))

        const updated = await db.select().from(greylistTable).where(eq(greylistTable.userId, '')).limit(1)

        const record = updated[0]
        if (!record) return { data: null }

        return {
          data: {
            ...record,
            words: storedWords,
            entriesJson: entries,
          },
        }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to update greylist' }
      }
    }
  )
}

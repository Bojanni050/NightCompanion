import { ipcMain } from 'electron'
import { drizzle } from 'drizzle-orm/postgres-js'
import { desc, eq, gte, sql } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { aiUsageEvents, openRouterModels } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

type UsageTotals = {
  calls: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
}

type UsageEventSummary = UsageTotals & {
  providerId: string
  modelId: string
  endpoint: string
  createdAt: string
}

type UsageSummary = {
  session: UsageTotals
  today: UsageTotals
  lastAction: UsageEventSummary | null
}

type UsageDailyTotals = UsageTotals & {
  day: string
}

type UsageCategory = 'generation' | 'improvement' | 'vision' | 'research_reasoning'

type UsageBreakdownModelRow = UsageTotals & {
  providerId: string
  modelId: string
  displayName: string
}

type UsageBreakdown = {
  categories: Record<UsageCategory, UsageTotals>
  topModels: UsageBreakdownModelRow[]
}

const sessionTotals: UsageTotals = {
  calls: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  costUsd: 0,
}

export function bumpSessionTotals(delta: UsageTotals) {
  sessionTotals.calls += delta.calls
  sessionTotals.promptTokens += delta.promptTokens
  sessionTotals.completionTokens += delta.completionTokens
  sessionTotals.totalTokens += delta.totalTokens
  sessionTotals.costUsd += delta.costUsd
}

export function resetSessionTotals() {
  sessionTotals.calls = 0
  sessionTotals.promptTokens = 0
  sessionTotals.completionTokens = 0
  sessionTotals.totalTokens = 0
  sessionTotals.costUsd = 0
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildTotals(input: { promptTokens?: unknown; completionTokens?: unknown; totalTokens?: unknown; costUsd?: unknown }): UsageTotals {
  const calls = toNumber((input as { calls?: unknown }).calls)
  const promptTokens = toNumber(input.promptTokens)
  const completionTokens = toNumber(input.completionTokens)
  const totalTokens = Number.isFinite(toNumber(input.totalTokens)) && toNumber(input.totalTokens) > 0
    ? toNumber(input.totalTokens)
    : promptTokens + completionTokens
  const costUsd = toNumber(input.costUsd)

  return {
    calls,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd,
  }
}

function getStartOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getCategoryForEndpoint(endpoint: string): UsageCategory {
  switch (endpoint) {
    case 'generator:magicRandom':
    case 'generator:quickExpand':
    case 'generator:simpleGenerate':
    case 'generator:generatePromptFromFields':
    case 'generator:fillAllFields':
    case 'generator:generateTitle':
    case 'generator:generateNegativePrompt':
      return 'generation'
    case 'generator:improvePrompt':
    case 'generator:improveNegativePrompt':
      return 'improvement'
    case 'generator:adviseModel':
    case 'generator:generateTags':
      return 'research_reasoning'
    default:
      return 'generation'
  }
}

export function registerUsageIpc({ db }: { db: Database }) {
  ipcMain.handle('usage:getSummary', async () => {
    try {
      const startOfToday = getStartOfToday()

      const todayRows = await db
        .select({
          calls: sql<number>`coalesce(count(*), 0)`,
          promptTokens: sql<number>`coalesce(sum(${aiUsageEvents.promptTokens}), 0)`,
          completionTokens: sql<number>`coalesce(sum(${aiUsageEvents.completionTokens}), 0)`,
          totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
          costUsd: sql<number>`coalesce(sum(${aiUsageEvents.costUsd}), 0)`,
        })
        .from(aiUsageEvents)
        .where(gte(aiUsageEvents.createdAt, startOfToday))

      const today = buildTotals(todayRows[0] || {})

      const lastRows = await db
        .select({
          providerId: aiUsageEvents.providerId,
          modelId: aiUsageEvents.modelId,
          endpoint: aiUsageEvents.endpoint,
          calls: sql<number>`1`,
          promptTokens: aiUsageEvents.promptTokens,
          completionTokens: aiUsageEvents.completionTokens,
          totalTokens: aiUsageEvents.totalTokens,
          costUsd: aiUsageEvents.costUsd,
          createdAt: aiUsageEvents.createdAt,
        })
        .from(aiUsageEvents)
        .orderBy(desc(aiUsageEvents.createdAt))
        .limit(1)

      const last = lastRows[0]

      const lastAction: UsageEventSummary | null = last
        ? {
          ...buildTotals(last),
          providerId: String(last.providerId || ''),
          modelId: String(last.modelId || ''),
          endpoint: String(last.endpoint || ''),
          createdAt: new Date(last.createdAt).toISOString(),
        }
        : null

      const summary: UsageSummary = {
        session: { ...sessionTotals },
        today,
        lastAction,
      }

      return { data: summary }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('usage:getBreakdown', async (_event, input?: { days?: number; topModelsLimit?: number }) => {
    try {
      const days = Number.isFinite(input?.days)
        ? Math.max(1, Math.min(365, Math.floor(input?.days as number)))
        : 30
      const topModelsLimit = Number.isFinite(input?.topModelsLimit)
        ? Math.max(1, Math.min(25, Math.floor(input?.topModelsLimit as number)))
        : 5

      const start = new Date()
      start.setDate(start.getDate() - (days - 1))
      start.setHours(0, 0, 0, 0)

      const rows = await db
        .select({
          endpoint: aiUsageEvents.endpoint,
          providerId: aiUsageEvents.providerId,
          modelId: aiUsageEvents.modelId,
          displayName: sql<string>`coalesce(${openRouterModels.displayName}, ${aiUsageEvents.modelId})`,
          calls: sql<number>`coalesce(count(*), 0)`,
          promptTokens: sql<number>`coalesce(sum(${aiUsageEvents.promptTokens}), 0)`,
          completionTokens: sql<number>`coalesce(sum(${aiUsageEvents.completionTokens}), 0)`,
          totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
          costUsd: sql<number>`coalesce(sum(${aiUsageEvents.costUsd}), 0)`,
        })
        .from(aiUsageEvents)
        .leftJoin(openRouterModels, eq(openRouterModels.modelId, aiUsageEvents.modelId))
        .where(gte(aiUsageEvents.createdAt, start))
        .groupBy(aiUsageEvents.endpoint, aiUsageEvents.providerId, aiUsageEvents.modelId, openRouterModels.displayName)

      const emptyTotals: UsageTotals = { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 }
      const categories: UsageBreakdown['categories'] = {
        generation: { ...emptyTotals },
        improvement: { ...emptyTotals },
        vision: { ...emptyTotals },
        research_reasoning: { ...emptyTotals },
      }

      const modelTotals = new Map<string, UsageBreakdownModelRow>()

      for (const row of rows) {
        const endpoint = String(row.endpoint || '')
        const category = getCategoryForEndpoint(endpoint)

        const totals = buildTotals(row)
        categories[category].calls += totals.calls
        categories[category].promptTokens += totals.promptTokens
        categories[category].completionTokens += totals.completionTokens
        categories[category].totalTokens += totals.totalTokens
        categories[category].costUsd += totals.costUsd

        const providerId = String(row.providerId || '')
        const modelId = String(row.modelId || '')
        const displayName = String((row as { displayName?: unknown }).displayName || modelId)
        const modelKey = `${providerId}:${modelId}`
        const existing = modelTotals.get(modelKey)
        if (existing) {
          existing.calls += totals.calls
          existing.promptTokens += totals.promptTokens
          existing.completionTokens += totals.completionTokens
          existing.totalTokens += totals.totalTokens
          existing.costUsd += totals.costUsd
        } else {
          modelTotals.set(modelKey, {
            providerId,
            modelId,
            displayName,
            ...totals,
          })
        }
      }

      const topModels = Array.from(modelTotals.values())
        .sort((a, b) => (b.calls - a.calls) || (b.totalTokens - a.totalTokens))
        .slice(0, topModelsLimit)

      const data: UsageBreakdown = {
        categories,
        topModels,
      }

      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('usage:listDaily', async (_, input?: { days?: number }) => {
    try {
      const days = Number.isFinite(input?.days) ? Math.max(1, Math.min(365, Math.floor(input?.days as number))) : 30
      const start = new Date()
      start.setDate(start.getDate() - (days - 1))
      start.setHours(0, 0, 0, 0)

      const rows = await db
        .select({
          day: sql<string>`date_trunc('day', ${aiUsageEvents.createdAt})`,
          calls: sql<number>`coalesce(count(*), 0)`,
          promptTokens: sql<number>`coalesce(sum(${aiUsageEvents.promptTokens}), 0)`,
          completionTokens: sql<number>`coalesce(sum(${aiUsageEvents.completionTokens}), 0)`,
          totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`,
          costUsd: sql<number>`coalesce(sum(${aiUsageEvents.costUsd}), 0)`,
        })
        .from(aiUsageEvents)
        .where(gte(aiUsageEvents.createdAt, start))
        .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
        .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt}) desc`)

      const data: UsageDailyTotals[] = rows.map((row) => {
        const totals = buildTotals(row)
        const dayValue = new Date(String(row.day))
        return {
          day: dayValue.toISOString(),
          ...totals,
        }
      })

      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('usage:reset', async (_, input?: { clearHistory?: boolean }) => {
    try {
      resetSessionTotals()

      if (input?.clearHistory) {
        await db.delete(aiUsageEvents)
      }

      return { data: undefined }
    } catch (error) {
      return { error: String(error) }
    }
  })
}

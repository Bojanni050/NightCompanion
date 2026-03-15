import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, isNull, lt, or } from 'drizzle-orm'
import * as schema from '../../src/lib/schema'
import { nightcafeModels } from '../../src/lib/schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

type HuggingFaceSearchModel = {
  id?: string
  likes?: number
  downloads?: number
  lastModified?: string
  pipeline_tag?: string
}

type HuggingFaceModelDetails = {
  id?: string
  likes?: number
  downloads?: number
  lastModified?: string
  pipeline_tag?: string
  cardData?: Record<string, unknown>
  description?: string
  readme?: string
}

type EnrichmentResult = {
  matched: boolean
  hfModelId: string | null
  summary: string
  downloads: number | null
  likes: number | null
  lastModified: Date | null
}

export type NightCafeHuggingFaceSyncStats = {
  total: number
  processed: number
  skippedFresh: number
  matched: number
  unmatched: number
  failed: number
}

const DEFAULT_TTL_HOURS = 24
const MAX_SUMMARY_LENGTH = 420
const HF_SEARCH_LIMIT = 6
const REQUEST_TIMEOUT_MS = 12_000
const MAX_CONCURRENCY = 4

const KNOWN_MODEL_ALIASES: Record<string, string[]> = {
  'stable diffusion 1.5': ['runwayml/stable-diffusion-v1-5'],
  'stable diffusion 1.4': ['CompVis/stable-diffusion-v1-4'],
  'sdxl 1.0': ['stabilityai/stable-diffusion-xl-base-1.0'],
  'dreamshaper v8': ['Lykon/DreamShaper'],
  'dreamshaper xl alpha2': ['Lykon/dreamshaper-xl-1-0'],
  'animagine xl v3': ['cagliostrolab/animagine-xl-3.1'],
  'realistic vision v5.1': ['SG161222/Realistic_Vision_V5.1_noVAE'],
  flux: ['black-forest-labs/FLUX.1-dev', 'black-forest-labs/FLUX.1-schnell'],
  'flux schnell': ['black-forest-labs/FLUX.1-schnell'],
  'flux 2 dev': ['black-forest-labs/FLUX.1-dev'],
  'flux 2 pro': ['black-forest-labs/FLUX.1-dev'],
  'flux pro v1.1': ['black-forest-labs/FLUX.1-dev'],
  'juggernaut xl v8': ['RunDiffusion/Juggernaut-XL-v8'],
  'juggernaut reborn': ['RunDiffusion/Juggernaut-XL-v8'],
  'coherent': ['openai/clip-vit-base-patch32'],
}

function normalizeModelName(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function trimSummary(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= MAX_SUMMARY_LENGTH) return cleaned
  return `${cleaned.slice(0, MAX_SUMMARY_LENGTH - 1)}…`
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function getFromCardData(cardData: Record<string, unknown> | undefined, key: string): string {
  if (!cardData) return ''
  const value = cardData[key]
  if (typeof value !== 'string') return ''
  return value
}

function extractSummary(details: HuggingFaceModelDetails): string {
  const cardData = details.cardData
  const candidates = [
    getFromCardData(cardData, 'model_description'),
    getFromCardData(cardData, 'description'),
    getFromCardData(cardData, 'summary'),
    details.description || '',
    details.readme || '',
  ].filter(Boolean)

  const first = candidates[0] || ''
  return first ? trimSummary(first) : ''
}

async function fetchJson<T>(url: string): Promise<T> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`Hugging Face request failed (${response.status}) for ${url}`)
    }

    return await response.json() as T
  } finally {
    clearTimeout(timeout)
  }
}

async function searchModels(query: string): Promise<HuggingFaceSearchModel[]> {
  const url = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&limit=${HF_SEARCH_LIMIT}&full=false`
  const results = await fetchJson<HuggingFaceSearchModel[]>(url)
  return Array.isArray(results) ? results : []
}

async function getModelDetails(modelId: string): Promise<HuggingFaceModelDetails | null> {
  try {
    const url = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`
    return await fetchJson<HuggingFaceModelDetails>(url)
  } catch {
    return null
  }
}

function pickBestSearchMatch(modelName: string, candidates: HuggingFaceSearchModel[]) {
  if (candidates.length === 0) return null

  const normalizedTarget = normalizeModelName(modelName)

  const scored = candidates
    .filter((candidate) => typeof candidate.id === 'string' && candidate.id.trim().length > 0)
    .map((candidate) => {
      const candidateId = candidate.id as string
      const normalizedCandidate = normalizeModelName(candidateId)

      let score = 0
      if (normalizedCandidate === normalizedTarget) score += 100
      if (normalizedCandidate.includes(normalizedTarget)) score += 35
      if (normalizedTarget.includes(normalizedCandidate)) score += 20
      if ((candidate.pipeline_tag || '').toLowerCase().includes('image')) score += 10

      return {
        candidate,
        score,
      }
    })
    .sort((first, second) => second.score - first.score)

  if (scored.length === 0) return null
  return scored[0].candidate
}

function getAliasCandidates(modelName: string) {
  const normalized = normalizeModelName(modelName)
  return KNOWN_MODEL_ALIASES[normalized] || []
}

async function enrichModel(modelName: string): Promise<EnrichmentResult> {
  const aliasCandidates = getAliasCandidates(modelName)

  for (const aliasModelId of aliasCandidates) {
    const details = await getModelDetails(aliasModelId)
    if (!details) continue

    const summary = extractSummary(details)
    return {
      matched: true,
      hfModelId: details.id || aliasModelId,
      summary,
      downloads: Number.isFinite(details.downloads) ? Number(details.downloads) : null,
      likes: Number.isFinite(details.likes) ? Number(details.likes) : null,
      lastModified: parseDate(details.lastModified),
    }
  }

  const searchResults = await searchModels(modelName)
  const bestMatch = pickBestSearchMatch(modelName, searchResults)
  if (!bestMatch?.id) {
    return {
      matched: false,
      hfModelId: null,
      summary: '',
      downloads: null,
      likes: null,
      lastModified: null,
    }
  }

  const details = await getModelDetails(bestMatch.id)
  if (!details) {
    return {
      matched: false,
      hfModelId: null,
      summary: '',
      downloads: null,
      likes: null,
      lastModified: null,
    }
  }

  return {
    matched: true,
    hfModelId: details.id || bestMatch.id,
    summary: extractSummary(details),
    downloads: Number.isFinite(details.downloads) ? Number(details.downloads) : null,
    likes: Number.isFinite(details.likes) ? Number(details.likes) : null,
    lastModified: parseDate(details.lastModified),
  }
}

async function runWithConcurrency<TItem>(
  items: TItem[],
  concurrency: number,
  worker: (item: TItem) => Promise<void>
) {
  const queue = [...items]
  const workers = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next) return
      await worker(next)
    }
  })

  await Promise.all(workers)
}

export async function syncNightCafeHuggingFaceModelcards(
  {
    db,
    force = false,
    ttlHours = DEFAULT_TTL_HOURS,
  }: {
    db: Database
    force?: boolean
    ttlHours?: number
  }
): Promise<NightCafeHuggingFaceSyncStats> {
  const now = new Date()
  const staleThreshold = new Date(Date.now() - Math.max(1, ttlHours) * 60 * 60 * 1000)

  const models = await db
    .select({
      id: nightcafeModels.id,
      modelName: nightcafeModels.modelName,
      hfSyncedAt: nightcafeModels.hfSyncedAt,
    })
    .from(nightcafeModels)
    .where(force
      ? undefined
      : or(
          lt(nightcafeModels.hfSyncedAt, staleThreshold),
          isNull(nightcafeModels.hfSyncedAt)
        ))

  const totalCount = await db
    .select({ id: nightcafeModels.id })
    .from(nightcafeModels)

  const stats: NightCafeHuggingFaceSyncStats = {
    total: totalCount.length,
    processed: 0,
    skippedFresh: Math.max(0, totalCount.length - models.length),
    matched: 0,
    unmatched: 0,
    failed: 0,
  }

  await runWithConcurrency(models, MAX_CONCURRENCY, async (model) => {
    stats.processed += 1

    try {
      const enrichment = await enrichModel(model.modelName)

      if (enrichment.matched) {
        stats.matched += 1
        await db
          .update(nightcafeModels)
          .set({
            hfModelId: enrichment.hfModelId,
            hfCardSummary: enrichment.summary,
            hfDownloads: enrichment.downloads,
            hfLikes: enrichment.likes,
            hfLastModified: enrichment.lastModified,
            hfSyncedAt: now,
            hfSyncStatus: 'matched',
            updatedAt: now,
          })
          .where(eq(nightcafeModels.id, model.id))

        return
      }

      stats.unmatched += 1
      await db
        .update(nightcafeModels)
        .set({
          hfModelId: null,
          hfCardSummary: '',
          hfDownloads: null,
          hfLikes: null,
          hfLastModified: null,
          hfSyncedAt: now,
          hfSyncStatus: 'unmatched',
          updatedAt: now,
        })
        .where(eq(nightcafeModels.id, model.id))
    } catch (error) {
      stats.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Hugging Face enrichment failed for ${model.modelName}: ${message}`)

      await db
        .update(nightcafeModels)
        .set({
          hfSyncedAt: now,
          hfSyncStatus: 'error',
          updatedAt: now,
        })
        .where(eq(nightcafeModels.id, model.id))
    }
  })

  return stats
}

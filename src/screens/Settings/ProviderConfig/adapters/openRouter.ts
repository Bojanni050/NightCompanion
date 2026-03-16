import type { ProviderAdapter, ProviderMetaStore } from '../types'
import type { ModelOption } from '../../types'

function formatPricePerMillion(priceText: string | null | undefined): string | null {
  if (!priceText)
    return null

  const parsed = Number(priceText)
  if (!Number.isFinite(parsed))
    return null

  const perMillion = parsed * 1_000_000
  if (perMillion > 0 && perMillion < 0.01)
    return '<$0.01'
  return `$${perMillion.toFixed(2)}`
}

function buildOpenRouterModelLabel(input: {
  displayName: string
  promptPrice: string | null
  completionPrice: string | null
}): string {
  const prompt = formatPricePerMillion(input.promptPrice)
  const completion = formatPricePerMillion(input.completionPrice)
  if (!prompt || !completion)
    return input.displayName

  return `${input.displayName} (${prompt}/${completion} per 1M tok in/out)`
}

function buildOpenRouterPriceLabel(input: {
  promptPrice: string | null
  completionPrice: string | null
}): string {
  const prompt = formatPricePerMillion(input.promptPrice)
  const completion = formatPricePerMillion(input.completionPrice)
  if (!prompt || !completion)
    return '—'

  return `${prompt}/${completion}`
}

function getOpenRouterCombinedPrice(model: Pick<ModelOption, 'promptPrice' | 'completionPrice'>): number {
  const prompt = Number(model.promptPrice || '')
  const completion = Number(model.completionPrice || '')

  if (!Number.isFinite(prompt) || !Number.isFinite(completion))
    return Number.POSITIVE_INFINITY

  return prompt + completion
}

function sortModelOptionsByPrice(models: ModelOption[]): ModelOption[] {
  return [...models].sort((first, second) => {
    const firstPrice = getOpenRouterCombinedPrice(first)
    const secondPrice = getOpenRouterCombinedPrice(second)

    if (firstPrice !== secondPrice)
      return firstPrice - secondPrice

    const firstLabel = first.label || first.name || first.id
    const secondLabel = second.label || second.name || second.id
    return firstLabel.localeCompare(secondLabel)
  })
}

export const openRouterAdapter: ProviderAdapter = {
  id: 'openrouter',

  async saveConfig(apiKey: string, model: string) {
    return window.electronAPI.settings.saveOpenRouter({ apiKey, model })
  },

  async testConnection(apiKey?: string, model?: string) {
    return window.electronAPI.settings.testOpenRouter(
      apiKey ? { apiKey, model: model || 'openai/gpt-4o-mini' } : undefined
    )
  },

  async fetchModels(apiKey?: string, model?: string) {
    return window.electronAPI.settings.refreshOpenRouterModels(
      apiKey ? { apiKey, model: model || 'openai/gpt-4o-mini' } : undefined
    )
  },

  async getProviderMeta(providerId: string, defaultModel: string) {
    return window.electronAPI.settings.getProviderMeta(providerId, defaultModel)
  },

  async saveProviderMeta(providerId: string, meta: ProviderMetaStore) {
    return window.electronAPI.settings.saveProviderMeta(providerId, meta)
  },

  buildModelLabel: buildOpenRouterModelLabel,
  buildPriceLabel: buildOpenRouterPriceLabel,
  sortModels: sortModelOptionsByPrice,
}

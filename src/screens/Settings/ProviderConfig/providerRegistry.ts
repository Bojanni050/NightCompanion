import type { ProviderAdapter } from './types'
import { openRouterAdapter } from './adapters/openRouter'

const providerRegistry = new Map<string, ProviderAdapter>()

export function registerProvider(adapter: ProviderAdapter): void {
  providerRegistry.set(adapter.id, adapter)
}

export function getProviderAdapter(id: string): ProviderAdapter | undefined {
  return providerRegistry.get(id)
}

export function hasProviderAdapter(id: string): boolean {
  return providerRegistry.has(id)
}

// Register built-in providers
registerProvider(openRouterAdapter)

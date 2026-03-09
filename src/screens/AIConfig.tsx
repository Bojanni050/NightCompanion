import { useCallback, useEffect, useMemo, useState } from 'react'

import { ConfigurationWizard } from './Settings/ConfigurationWizard'
import { Dashboard } from './Settings/Dashboard'
import type { ApiKeyInfo, LocalEndpoint, ModelOption } from './Settings/types'

interface ProviderMetaStore {
  model_gen: string
  model_improve: string
  model_vision: string
  is_active: boolean
  is_active_gen: boolean
  is_active_improve: boolean
  is_active_vision: boolean
}

type LegacyLocalEndpoint = Partial<LocalEndpoint> & {
  id?: string
  name?: string
  baseUrl?: string
  model?: string
}

function readProviderMeta(providerId: string, fallbackModel: string): ProviderMetaStore {
  try {
    const raw = localStorage.getItem('providerMeta')
    const parsed = raw ? (JSON.parse(raw) as Record<string, ProviderMetaStore>) : {}

    if (parsed[providerId])
      return parsed[providerId]
  } catch (error) {
    console.error('Failed to read provider meta', error)
  }

  return {
    model_gen: fallbackModel,
    model_improve: fallbackModel,
    model_vision: fallbackModel,
    is_active: false,
    is_active_gen: false,
    is_active_improve: false,
    is_active_vision: false,
  }
}

function normalizeLocalEndpoint(input: Partial<LocalEndpoint> & { id?: string; name?: string; baseUrl?: string; model?: string }): LocalEndpoint {
  const modelName = input.model_name || input.model_gen || input.model || 'llama3.2:latest'

  return {
    id: input.id || crypto.randomUUID(),
    provider: input.provider || undefined,
    name: input.name || 'Local Endpoint',
    baseUrl: input.baseUrl || '',
    model_name: modelName,
    model_gen: input.model_gen || modelName,
    model_improve: input.model_improve || modelName,
    model_vision: input.model_vision || modelName,
    is_active: input.is_active || false,
    is_active_gen: input.is_active_gen || false,
    is_active_improve: input.is_active_improve || false,
    is_active_vision: input.is_active_vision || false,
    updated_at: input.updated_at || new Date().toISOString(),
  }
}

function inferLocalProvider(input: LegacyLocalEndpoint): string | undefined {
  if (input.provider) return input.provider

  const name = (input.name || '').toLowerCase()
  const baseUrl = (input.baseUrl || '').toLowerCase()

  if (name.includes('ollama') || baseUrl.includes('11434')) return 'ollama'
  if (name.includes('lm studio') || name.includes('lmstudio') || baseUrl.includes('1234')) return 'lmstudio'

  return undefined
}

function migrateLegacyLocalEndpoints(rawEndpoints: LegacyLocalEndpoint[]): {
  endpoints: LocalEndpoint[]
  didMigrate: boolean
} {
  let didMigrate = false

  const migrated = rawEndpoints.map((endpoint) => {
    const inferredProvider = inferLocalProvider(endpoint)
    const normalized = normalizeLocalEndpoint({
      ...endpoint,
      provider: inferredProvider,
    })

    const neededProviderInference = !endpoint.provider && Boolean(inferredProvider)
    const neededModelNameMigration = !endpoint.model_name && Boolean(endpoint.model)
    if (neededProviderInference || neededModelNameMigration) didMigrate = true

    return normalized
  })

  return { endpoints: migrated, didMigrate }
}

export function AIConfig() {
  const [view, setView] = useState<'dashboard' | 'wizard'>('dashboard')
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [localEndpoints, setLocalEndpoints] = useState<LocalEndpoint[]>([])
  const [loading, setLoading] = useState(true)

  const [dynamicModels, setDynamicModels] = useState<Record<string, ModelOption[]>>(() => {
    try {
      const saved = localStorage.getItem('cachedModels')
      return saved ? (JSON.parse(saved) as Record<string, ModelOption[]>) : {}
    } catch (error) {
      console.error('Failed to load cached models', error)
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('cachedModels', JSON.stringify(dynamicModels))
    } catch (error) {
      console.error('Failed to save cached models', error)
    }
  }, [dynamicModels])

  const getToken = useCallback(async () => 'local-desktop-token', [])

  const loadKeys = useCallback(async () => {
    const result = await window.electronAPI.settings.getOpenRouter()

    if (result.error || !result.data?.apiKey) {
      setKeys([])
      return
    }

    const modelName = result.data.model || 'openai/gpt-4o-mini'
    const meta = readProviderMeta('openrouter', modelName)

    const key = result.data.apiKey
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****'

    setKeys([
      {
        id: 'openrouter-key',
        provider: 'openrouter',
        apiKeyMasked: masked,
        key_hint: masked,
        model_name: modelName,
        model_gen: meta.model_gen || modelName,
        model_improve: meta.model_improve || modelName,
        model_vision: meta.model_vision || modelName,
        is_active: meta.is_active,
        is_active_gen: meta.is_active_gen,
        is_active_improve: meta.is_active_improve,
        is_active_vision: meta.is_active_vision,
      },
    ])
  }, [])

  const loadLocalEndpoints = useCallback(async () => {
    try {
      const saved = localStorage.getItem('localEndpoints')
      const parsed = saved ? (JSON.parse(saved) as LegacyLocalEndpoint[]) : []
      const { endpoints, didMigrate } = migrateLegacyLocalEndpoints(parsed)

      if (didMigrate) {
        localStorage.setItem('localEndpoints', JSON.stringify(endpoints))
      }

      setLocalEndpoints(endpoints)
    } catch (error) {
      console.error('Failed to load local endpoints', error)
      setLocalEndpoints([])
    }
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([loadKeys(), loadLocalEndpoints()])

    const modelsResult = await window.electronAPI.settings.listOpenRouterModels()
    if (modelsResult.error || !modelsResult.data)
      return

    setDynamicModels((prev) => ({
      ...prev,
      openrouter: modelsResult.data.map((item) => ({
        id: item.modelId,
        label: item.displayName,
        provider: 'openrouter',
        capabilities: item.modelId.toLowerCase().includes('vision') ? ['vision'] : undefined,
      })),
    }))
  }, [loadKeys, loadLocalEndpoints])

  useEffect(() => {
    let active = true

    const init = async () => {
      setLoading(true)
      await refreshData()
      if (active) setLoading(false)
    }

    void init()

    return () => {
      active = false
    }
  }, [refreshData])

  const activeGen = useMemo(
    () => keys.find((key) => key.is_active_gen) || localEndpoints.find((endpoint) => endpoint.is_active_gen),
    [keys, localEndpoints]
  )

  const activeImprove = useMemo(
    () => keys.find((key) => key.is_active_improve) || localEndpoints.find((endpoint) => endpoint.is_active_improve),
    [keys, localEndpoints]
  )

  const activeVision = useMemo(
    () => keys.find((key) => key.is_active_vision) || localEndpoints.find((endpoint) => endpoint.is_active_vision),
    [keys, localEndpoints]
  )

  const activeResearch = activeGen
  const configuredCount = keys.length + localEndpoints.length

  if (loading && keys.length === 0 && localEndpoints.length === 0) {
    return (
      <div className="no-drag-region h-full flex items-center justify-center">
        <p className="text-sm text-night-400">Loading AI configuration...</p>
      </div>
    )
  }

  return (
    <div className="no-drag-region h-full overflow-y-auto px-8 pt-8 pb-10">
      {view === 'dashboard' ? (
        <Dashboard
          activeGen={activeGen}
          activeImprove={activeImprove}
          activeVision={activeVision}
          activeResearch={activeResearch}
          onConfigure={() => setView('wizard')}
          configuredCount={configuredCount}
          keys={keys}
          localEndpoints={localEndpoints}
          dynamicModels={dynamicModels}
          setDynamicModels={setDynamicModels}
          onRefreshData={refreshData}
          getToken={getToken}
        />
      ) : (
        <ConfigurationWizard
          keys={keys}
          localEndpoints={localEndpoints}
          onBack={() => setView('dashboard')}
          onComplete={() => {
            void refreshData()
            setView('dashboard')
          }}
          loadKeys={loadKeys}
          loadLocalEndpoints={loadLocalEndpoints}
          getToken={getToken}
          dynamicModels={dynamicModels}
          setDynamicModels={setDynamicModels}
        />
      )}
    </div>
  )
}

export default AIConfig

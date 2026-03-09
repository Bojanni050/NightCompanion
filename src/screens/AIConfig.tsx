import { useState, useEffect, useCallback } from 'react'
import { Dashboard } from './Settings/Dashboard'
import { ConfigurationWizard } from './Settings/ConfigurationWizard'
import type { ApiKeyInfo, LocalEndpoint, ModelOption } from './Settings/types'

export function AIConfig() {
  const [view, setView] = useState<'dashboard' | 'wizard'>('dashboard')
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [localEndpoints, setLocalEndpoints] = useState<LocalEndpoint[]>([])
  const [loading, setLoading] = useState(true)

  const [dynamicModels, setDynamicModels] = useState<Record<string, ModelOption[]>>(() => {
    try {
      const saved = localStorage.getItem('cachedModels')
      return saved ? JSON.parse(saved) : {}
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

  const getToken = useCallback(async () => {
    return 'mock-token'
  }, [])

  const loadKeys = useCallback(async () => {
    const result = await window.electronAPI.settings.getOpenRouter()

    if (result.error || !result.data?.apiKey) {
      setKeys([])
      return
    }

    const key = result.data.apiKey
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****'

    setKeys([
      {
        id: 'openrouter-key',
        provider: 'OpenRouter',
        apiKeyMasked: masked,
        model: result.data.model || 'openai/gpt-4o-mini',
        is_active_gen: true,
        is_active_improve: true,
        is_active_vision: false,
      },
    ])
  }, [])

  const loadLocalEndpoints = useCallback(async () => {
    try {
      const saved = localStorage.getItem('localEndpoints')
      const parsed = saved ? (JSON.parse(saved) as LocalEndpoint[]) : []
      setLocalEndpoints(parsed)
    } catch (error) {
      console.error('Failed to load local endpoints', error)
      setLocalEndpoints([])
    }
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([loadKeys(), loadLocalEndpoints()])
  }, [loadKeys, loadLocalEndpoints])

  useEffect(() => {
    let active = true

    const init = async () => {
      setLoading(true)
      await refreshData()
      if (active) setLoading(false)
    }

    init()

    return () => {
      active = false
    }
  }, [refreshData])

  const activeGen = keys.find((key) => key.is_active_gen) || localEndpoints.find((endpoint) => endpoint.is_active_gen)
  const activeImprove = keys.find((key) => key.is_active_improve) || localEndpoints.find((endpoint) => endpoint.is_active_improve)
  const activeVision = keys.find((key) => key.is_active_vision) || localEndpoints.find((endpoint) => endpoint.is_active_vision)
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
            refreshData()
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

import type { Dispatch, SetStateAction } from 'react'
import type { ApiKeyInfo, LocalEndpoint, ModelOption } from './types'

interface DashboardProps {
  activeGen?: ApiKeyInfo | LocalEndpoint
  activeImprove?: ApiKeyInfo | LocalEndpoint
  activeVision?: ApiKeyInfo | LocalEndpoint
  activeResearch?: ApiKeyInfo | LocalEndpoint
  onConfigure: () => void
  configuredCount: number
  keys: ApiKeyInfo[]
  localEndpoints: LocalEndpoint[]
  dynamicModels: Record<string, ModelOption[]>
  setDynamicModels: Dispatch<SetStateAction<Record<string, ModelOption[]>>>
  onRefreshData: () => Promise<void>
  getToken: () => Promise<string>
}

function formatProvider(source?: ApiKeyInfo | LocalEndpoint) {
  if (!source) return 'Not configured'
  if ('provider' in source) return `${source.provider} (${source.model})`
  return `${source.name} (${source.model})`
}

export function Dashboard({
  activeGen,
  activeImprove,
  activeVision,
  activeResearch,
  onConfigure,
  configuredCount,
  keys,
  localEndpoints,
  dynamicModels,
  setDynamicModels,
  onRefreshData,
  getToken,
}: DashboardProps) {
  void setDynamicModels
  void getToken
  const modelGroups = Object.keys(dynamicModels).length

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">AI Config</h1>
        <p className="text-sm text-night-400 mt-1">Dashboard met actieve providers en model-caches.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard title="Generation" value={formatProvider(activeGen)} />
        <StatusCard title="Improve" value={formatProvider(activeImprove)} />
        <StatusCard title="Vision" value={formatProvider(activeVision)} />
        <StatusCard title="Research" value={formatProvider(activeResearch)} />
      </div>

      <div className="card p-5 flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={onConfigure}>Open configuratie wizard</button>
        <button className="btn-ghost border border-night-600/50" onClick={onRefreshData}>Refresh data</button>
        <span className="text-xs text-night-500">Geconfigureerde bronnen: {configuredCount}</span>
        <span className="text-xs text-night-500">Modelgroepen in cache: {modelGroups}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-3">API Keys</h2>
          {keys.length === 0 && <p className="text-xs text-night-500">Nog geen API keys opgeslagen.</p>}
          <div className="space-y-2">
            {keys.map((key) => (
              <div key={key.id} className="rounded-lg border border-night-600/50 p-3 bg-night-900/40">
                <p className="text-sm text-night-100">{key.provider}</p>
                <p className="text-xs text-night-400">{key.apiKeyMasked}</p>
                <p className="text-xs text-night-500">Model: {key.model}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Local Endpoints</h2>
          {localEndpoints.length === 0 && <p className="text-xs text-night-500">Nog geen lokale endpoint toegevoegd.</p>}
          <div className="space-y-2">
            {localEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="rounded-lg border border-night-600/50 p-3 bg-night-900/40">
                <p className="text-sm text-night-100">{endpoint.name}</p>
                <p className="text-xs text-night-400">{endpoint.baseUrl}</p>
                <p className="text-xs text-night-500">Model: {endpoint.model}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-night-500 uppercase tracking-wide">{title}</p>
      <p className="text-sm text-night-100 mt-1">{value}</p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApiKeyInfo, LocalEndpoint, ModelOption } from './types'

interface ConfigurationWizardProps {
  keys: ApiKeyInfo[]
  localEndpoints: LocalEndpoint[]
  onBack: () => void
  onComplete: () => void
  loadKeys: () => Promise<void>
  loadLocalEndpoints: () => Promise<void>
  getToken: () => Promise<string>
  dynamicModels: Record<string, ModelOption[]>
  setDynamicModels: Dispatch<SetStateAction<Record<string, ModelOption[]>>>
}

interface EndpointDraft {
  name: string
  baseUrl: string
  model: string
}

const EMPTY_ENDPOINT: EndpointDraft = {
  name: '',
  baseUrl: '',
  model: 'llama3.2:latest',
}

export function ConfigurationWizard({
  keys,
  onBack,
  onComplete,
  loadKeys,
  loadLocalEndpoints,
  localEndpoints,
  getToken,
  dynamicModels,
  setDynamicModels,
}: ConfigurationWizardProps) {
  void keys
  void getToken
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('openai/gpt-4o-mini')
  const [endpointDraft, setEndpointDraft] = useState<EndpointDraft>(EMPTY_ENDPOINT)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const cachedOpenRouterModels = useMemo(() => {
    return dynamicModels.openrouter || []
  }, [dynamicModels])

  const saveOpenRouter = async () => {
    setStatus(null)
    setSaving(true)

    const result = await window.electronAPI.settings.saveOpenRouter({
      apiKey,
      model,
    })

    setSaving(false)

    if (result.error) {
      setStatus(`Error: ${result.error}`)
      return
    }

    setDynamicModels((prev) => {
      const current = prev.openrouter || []
      if (current.some((item) => item.id === model)) return prev

      return {
        ...prev,
        openrouter: [...current, { id: model, label: model }],
      }
    })

    await loadKeys()
    setStatus('OpenRouter key opgeslagen.')
  }

  const addEndpoint = async () => {
    setStatus(null)

    if (!endpointDraft.name || !endpointDraft.baseUrl || !endpointDraft.model) {
      setStatus('Error: Vul naam, base URL en model in voor je endpoint.')
      return
    }

    const next: LocalEndpoint = {
      id: crypto.randomUUID(),
      name: endpointDraft.name,
      baseUrl: endpointDraft.baseUrl,
      model: endpointDraft.model,
      is_active_gen: false,
      is_active_improve: false,
      is_active_vision: false,
      updated_at: new Date().toISOString(),
    }

    const updatedEndpoints = [next, ...localEndpoints]
    localStorage.setItem('localEndpoints', JSON.stringify(updatedEndpoints))
    await loadLocalEndpoints()
    setEndpointDraft(EMPTY_ENDPOINT)
    setStatus('Lokale endpoint toegevoegd.')
  }

  const removeEndpoint = async (id: string) => {
    const updatedEndpoints = localEndpoints.filter((endpoint) => endpoint.id !== id)
    localStorage.setItem('localEndpoints', JSON.stringify(updatedEndpoints))
    await loadLocalEndpoints()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">AI Config Wizard</h1>
          <p className="text-sm text-night-400 mt-1">Configureer API keys en lokale endpoints in 1 flow.</p>
        </div>
        <button className="btn-ghost border border-night-600/50" onClick={onBack}>Terug naar dashboard</button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Stap 1: OpenRouter</h2>
        <div>
          <label className="label">API key</label>
          <input
            className="input"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-or-v1-..."
          />
        </div>

        <div>
          <label className="label">Model</label>
          <input
            className="input"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="openai/gpt-4o-mini"
          />
        </div>

        {cachedOpenRouterModels.length > 0 && (
          <div>
            <p className="text-xs text-night-500 mb-2">Cached modellen</p>
            <div className="flex flex-wrap gap-2">
              {cachedOpenRouterModels.map((cachedModel) => (
                <button
                  key={cachedModel.id}
                  className="tag hover:border-glow-purple/50"
                  onClick={() => setModel(cachedModel.id)}
                >
                  {cachedModel.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={saveOpenRouter} disabled={saving}>
          {saving ? 'Opslaan...' : 'OpenRouter opslaan'}
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Stap 2: Local Endpoint</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input"
            value={endpointDraft.name}
            placeholder="Naam"
            onChange={(event) => setEndpointDraft((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            className="input"
            value={endpointDraft.baseUrl}
            placeholder="http://localhost:11434/v1"
            onChange={(event) => setEndpointDraft((prev) => ({ ...prev, baseUrl: event.target.value }))}
          />
          <input
            className="input"
            value={endpointDraft.model}
            placeholder="llama3.2:latest"
            onChange={(event) => setEndpointDraft((prev) => ({ ...prev, model: event.target.value }))}
          />
        </div>
        <button className="btn-ghost border border-night-600/50" onClick={addEndpoint}>Endpoint toevoegen</button>

        <div className="space-y-2">
          {localEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="rounded-lg border border-night-600/50 p-3 bg-night-900/40 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-night-100">{endpoint.name}</p>
                <p className="text-xs text-night-400">{endpoint.baseUrl}</p>
                <p className="text-xs text-night-500">Model: {endpoint.model}</p>
              </div>
              <button className="btn-danger" onClick={() => removeEndpoint(endpoint.id)}>Verwijder</button>
            </div>
          ))}
        </div>
      </div>

      {status && <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={onComplete}>Klaar</button>
        <button className="btn-ghost border border-night-600/50" onClick={onBack}>Annuleren</button>
      </div>
    </div>
  )
}

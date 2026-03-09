import { useEffect, useState } from 'react'

type OpenRouterForm = {
  apiKey: string
  model: string
  siteUrl: string
  appName: string
}

type OpenRouterModel = {
  modelId: string
  displayName: string
  contextLength: number | null
}

const DEFAULT_FORM: OpenRouterForm = {
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  siteUrl: '',
  appName: 'NightCompanion',
}

export default function Settings() {
  const [form, setForm] = useState<OpenRouterForm>(DEFAULT_FORM)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const [settingsResult, modelsResult] = await Promise.all([
        window.electronAPI.settings.getOpenRouter(),
        window.electronAPI.settings.listOpenRouterModels(),
      ])
      if (!active) return

      if (settingsResult.error) {
        setStatus(`Error: ${settingsResult.error}`)
      } else if (settingsResult.data) {
        setForm(settingsResult.data)
      } else {
        setStatus('Error: Settings API returned no data.')
      }

      if (modelsResult.error) {
        setStatus(`Error: ${modelsResult.error}`)
      } else if (modelsResult.data) {
        setModels(modelsResult.data)
      }

      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const update = (key: keyof OpenRouterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setStatus(null)
    setSaving(true)

    const result = await window.electronAPI.settings.saveOpenRouter(form)
    setSaving(false)

    if (result.error) {
      setStatus(`Error: ${result.error}`)
      return
    }

    if (result.data) {
      setForm(result.data)

      const modelsResult = await window.electronAPI.settings.listOpenRouterModels()
      if (modelsResult.data) {
        setModels(modelsResult.data)
      }

      setStatus('Settings saved.')
      return
    }

    setStatus('Error: Settings API returned no data.')
  }

  const handleRefreshModels = async () => {
    setStatus(null)
    setRefreshing(true)

    const result = await window.electronAPI.settings.refreshOpenRouterModels(form)
    setRefreshing(false)

    if (result.error) {
      setStatus(`Error: ${result.error}`)
      return
    }

    if (!result.data) {
      setStatus('Error: Model refresh returned no data.')
      return
    }

    setModels(result.data)

    if (result.data.length > 0 && !result.data.some((m) => m.modelId === form.model)) {
      setForm((prev) => ({ ...prev, model: result.data[0].modelId }))
    }

    setStatus(`Model list refreshed (${result.data.length} models).`)
  }

  const handleTestConnection = async () => {
    setStatus(null)
    setTesting(true)

    const result = await window.electronAPI.settings.testOpenRouter(form)
    setTesting(false)

    if (result.error) {
      setStatus(`Error: ${result.error}`)
      return
    }

    if (!result.data) {
      setStatus('Error: Connection test returned no data.')
      return
    }

    setStatus(`Connection OK. OpenRouter returned ${result.data.modelCount} models.`)
  }

  if (loading) {
    return (
      <div className="no-drag-region h-full flex items-center justify-center">
        <p className="text-sm text-night-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="no-drag-region h-full overflow-y-auto px-8 pt-8 pb-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-night-400 mt-1">Configure your OpenRouter credentials for AI-powered prompt generation.</p>

        <div className="card mt-6 p-5 space-y-4">
          <div>
            <label className="label">OpenRouter API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              className="input"
              placeholder="sk-or-v1-..."
            />
          </div>

          <div>
            <label className="label">Model</label>
            <select
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              className="input"
              title="OpenRouter model"
            >
              {models.length === 0 && (
                <option value={form.model || DEFAULT_FORM.model}>{form.model || DEFAULT_FORM.model}</option>
              )}

              {models.map((model) => (
                <option key={model.modelId} value={model.modelId}>
                  {model.displayName}
                  {model.contextLength ? ` (${model.contextLength.toLocaleString()} ctx)` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-night-500">
              {models.length > 0
                ? `${models.length} models beschikbaar in lokale cache.`
                : 'Geen modellen in cache. Gebruik Refresh modellen na het invullen van je API key.'}
            </p>
          </div>

          <div>
            <label className="label">HTTP Referer (optional)</label>
            <input
              type="text"
              value={form.siteUrl}
              onChange={(e) => update('siteUrl', e.target.value)}
              className="input"
              placeholder="https://your-app-site.example"
            />
          </div>

          <div>
            <label className="label">App Name / Title Header (optional)</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => update('appName', e.target.value)}
              className="input"
              placeholder="NightCompanion"
            />
          </div>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button onClick={handleTestConnection} disabled={testing} className="btn-ghost border border-night-600/50">
              {testing ? 'Testing...' : 'Test verbinding'}
            </button>
            <button onClick={handleRefreshModels} disabled={refreshing} className="btn-ghost border border-night-600/50">
              {refreshing ? 'Refreshing...' : 'Refresh modellen'}
            </button>
            <span className="text-xs text-night-500">Stored locally on this machine.</span>
          </div>

          {status && (
            <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

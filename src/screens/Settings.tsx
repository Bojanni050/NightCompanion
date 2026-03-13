import { useEffect, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [aiApiRequestLoggingEnabled, setAiApiRequestLoggingEnabled] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      const result = await window.electronAPI.settings.getAiConfigState()
      if (!active)
        return

      setAiApiRequestLoggingEnabled(Boolean(result.data?.aiApiRequestLoggingEnabled))
      setLoading(false)
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleToggle() {
    const nextValue = !aiApiRequestLoggingEnabled
    setAiApiRequestLoggingEnabled(nextValue)

    await window.electronAPI.settings.saveAiConfigState({
      aiApiRequestLoggingEnabled: nextValue,
    })
  }

  return (
    <div className="no-drag-region h-full overflow-y-auto px-8 pt-8 pb-10">
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <SettingsIcon className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-sm text-night-400">Application preferences and diagnostics</p>
        </div>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Diagnostics</h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">AI API request logging</p>
              <p className="text-xs text-night-400">Log AI request/response payloads to a local JSONL file for debugging</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={aiApiRequestLoggingEnabled}
              disabled={loading}
              onClick={() => {
                if (!loading) void handleToggle()
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiApiRequestLoggingEnabled ? 'bg-teal-500' : 'bg-night-600'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiApiRequestLoggingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

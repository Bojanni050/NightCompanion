import { useEffect, useState } from 'react'
import { Check, Cpu, Loader2, Trash2, Zap, Eye } from 'lucide-react'

import type { LocalEndpoint } from '../screens/Settings/types'
import type { AIRole } from '../lib/constants'

interface LocalEndpointCardProps {
  type: string
  endpoint?: LocalEndpoint
  actionLoading: string | null
  onSave: (url: string, modelGen: string, modelImprove: string, modelVision: string) => Promise<void>
  onDelete: () => Promise<void>
  onSetActive: (role: AIRole) => Promise<void>
}

export function LocalEndpointCard({ type, endpoint, actionLoading, onSave, onDelete, onSetActive }: LocalEndpointCardProps) {
  const [url, setUrl] = useState(endpoint?.baseUrl || '')
  const [modelGen, setModelGen] = useState(endpoint?.model_gen || endpoint?.model_name || '')
  const [modelImprove, setModelImprove] = useState(endpoint?.model_improve || endpoint?.model_name || '')
  const [modelVision, setModelVision] = useState(endpoint?.model_vision || endpoint?.model_name || '')

  useEffect(() => {
    setUrl(endpoint?.baseUrl || '')
    setModelGen(endpoint?.model_gen || endpoint?.model_name || '')
    setModelImprove(endpoint?.model_improve || endpoint?.model_name || '')
    setModelVision(endpoint?.model_vision || endpoint?.model_name || '')
  }, [endpoint])

  const title = type === 'ollama' ? 'Ollama' : 'LM Studio'
  const isSaving = actionLoading === type
  const isDeleting = actionLoading === `${type}-delete`

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h4 className="text-white font-semibold flex items-center gap-2">
        <Cpu size={16} className="text-amber-400" />
        {title}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="http://localhost:11434/v1"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <input
          className="input"
          placeholder="Generation model"
          value={modelGen}
          onChange={(event) => setModelGen(event.target.value)}
        />
        <input
          className="input"
          placeholder="Improve model"
          value={modelImprove}
          onChange={(event) => setModelImprove(event.target.value)}
        />
        <input
          className="input"
          placeholder="Vision model"
          value={modelVision}
          onChange={(event) => setModelVision(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSave(url, modelGen, modelImprove, modelVision)}
          disabled={isSaving || !url || !modelGen}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-semibold disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <span className="inline-flex items-center gap-2"><Check size={14} /> Save</span>}
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-red-300 rounded-xl text-sm disabled:opacity-50"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <span className="inline-flex items-center gap-2"><Trash2 size={14} /> Remove</span>}
        </button>
      </div>

      {endpoint && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4 border-t border-slate-800/60">
          <button
            onClick={() => onSetActive('generation')}
            className={`py-2 rounded-xl border text-xs ${endpoint.is_active_gen ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-transparent text-slate-300'}`}
          >
            <span className="inline-flex items-center gap-1"><Zap size={12} /> {endpoint.is_active_gen ? 'Active Gen' : 'Set Gen'}</span>
          </button>
          <button
            onClick={() => onSetActive('improvement')}
            className={`py-2 rounded-xl border text-xs ${endpoint.is_active_improve ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-transparent text-slate-300'}`}
          >
            <span className="inline-flex items-center gap-1"><Zap size={12} /> {endpoint.is_active_improve ? 'Active Improve' : 'Set Improve'}</span>
          </button>
          <button
            onClick={() => onSetActive('vision')}
            className={`py-2 rounded-xl border text-xs ${endpoint.is_active_vision ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-slate-800 border-transparent text-slate-300'}`}
          >
            <span className="inline-flex items-center gap-1"><Eye size={12} /> {endpoint.is_active_vision ? 'Active Vision' : 'Set Vision'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

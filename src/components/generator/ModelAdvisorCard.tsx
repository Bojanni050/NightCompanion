import { Minus, Wand2 } from 'lucide-react'

type BudgetMode = 'cheap' | 'balanced' | 'premium'

type ModelAdvisorCardProps = {
  generatedPrompt: string
  recommendedModel: string
  setRecommendedModel: (value: string) => void
  recommendedModelReason: string
  setRecommendedModelReason: (value: string) => void
  recommendedModelMode: 'rule' | 'ai' | null
  setRecommendedModelMode: (value: 'rule' | 'ai' | null) => void
  advisorBestValue: string
  setAdvisorBestValue: (value: string) => void
  advisorFastest: string
  setAdvisorFastest: (value: string) => void
  supportsNegativePrompt: boolean | null
  setSupportsNegativePrompt: (value: boolean | null) => void
  budgetMode: BudgetMode
  setBudgetMode: (value: BudgetMode) => void
  advisingAi: boolean
  setAdvisingAi: (value: boolean) => void
  handleAdviseModel: () => void
  loading: boolean
  improving: boolean
  generatingNegative: boolean
  improvingNegative: boolean
}

export default function ModelAdvisorCard({
  generatedPrompt,
  recommendedModel,
  recommendedModelReason,
  recommendedModelMode,
  advisorBestValue,
  advisorFastest,
  supportsNegativePrompt,
  budgetMode,
  advisingAi,
  handleAdviseModel,
  loading,
  improving,
  generatingNegative,
  improvingNegative,
}: ModelAdvisorCardProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-glow-amber">Suggested Model</p>
        <button
          type="button"
          onClick={handleAdviseModel}
          disabled={!generatedPrompt.trim() || loading || improving || generatingNegative || improvingNegative || advisingAi}
          className="btn-compact-teal"
        >
          <Wand2 className="w-3.5 h-3.5" /> {advisingAi ? 'Getting AI Advice...' : 'Get AI Advice'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Budget:</span>
        {(['cheap', 'balanced', 'premium'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setBudgetMode(mode)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${budgetMode === mode ? 'btn-compact-primary' : 'btn-compact-ghost'}`}
          >
            {mode === 'cheap' ? 'Goedkoop' : mode === 'balanced' ? 'Gebalanceerd' : 'Premium'}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">Beste kwaliteit</span>
        <span className="text-2xl font-semibold text-white flex items-center gap-2">{recommendedModel || <Minus className="w-6 h-6 text-slate-500" />}</span>
      </div>
      <p className="mt-1 text-sm text-slate-400">{recommendedModelReason || 'Nog geen modeladvies beschikbaar. Genereer eerst een prompt.'}</p>

      {/* Model mode indicator */}
      {recommendedModelMode && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Advies via:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            recommendedModelMode === 'ai' 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {recommendedModelMode === 'ai' ? 'AI' : 'Rule'}
          </span>
        </div>
      )}

      {/* Negative prompt support badge */}
      {supportsNegativePrompt !== null && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Negative prompt:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            supportsNegativePrompt 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {supportsNegativePrompt ? 'Supported' : 'Not supported'}
          </span>
        </div>
      )}

      {/* Alternative models */}
      {(advisorBestValue || advisorFastest) && (
        <div className="mt-3 space-y-2">
          {advisorBestValue && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Best value:</span>
              <span className="text-xs font-medium text-glow-cyan">{advisorBestValue}</span>
            </div>
          )}
          {advisorFastest && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Fastest:</span>
              <span className="text-xs font-medium text-glow-blue">{advisorFastest}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
import { Wand2 } from 'lucide-react'

type BudgetMode = 'cheap' | 'balanced' | 'premium'

type BudgetPick = {
  modelName: string
  reasons: string[]
}

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
  advisorCheapPick: BudgetPick
  advisorBalancedPick: BudgetPick
  advisorPremiumPick: BudgetPick
}

function buildThinkingLines(reason: string): string[] {
  const normalized = reason
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return normalized
    .filter((line) => {
      const lower = line.toLowerCase()
      return !(lower.includes('recommended model') || lower.includes('suggested model') || lower.includes('conclusion'))
    })
    .map((line) => line.replace(/^[-*•]\s*/, ''))
}

function extractSuggestedModelFromReason(reason: string): string {
  const lines = reason
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const match = line.match(/(?:recommended|suggested)\s+model\s*[:-]\s*(.+)$/i)

    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}

function BudgetPickCard({ pick, label, accentClass }: { pick: BudgetPick; label: string; accentClass: string }) {
  if (!pick.modelName) {
    return (
      <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-sm text-slate-500">No recommendation yet</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${accentClass} bg-slate-800/30 p-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <span className="text-sm font-semibold text-white">{pick.modelName}</span>
      </div>
      {pick.reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {pick.reasons.map((reason, index) => (
            <li key={`${index}-${reason}`} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="text-slate-500 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
  setBudgetMode,
  advisingAi,
  handleAdviseModel,
  loading,
  improving,
  generatingNegative,
  improvingNegative,
  advisorCheapPick,
  advisorBalancedPick,
  advisorPremiumPick,
}: ModelAdvisorCardProps) {
  const thinkingLines = buildThinkingLines(recommendedModelReason)
  const parsedSuggestedModel = extractSuggestedModelFromReason(recommendedModelReason)
  const displaySuggestedModel = recommendedModel || parsedSuggestedModel

  const currentPick = budgetMode === 'cheap' ? advisorCheapPick : budgetMode === 'balanced' ? advisorBalancedPick : advisorPremiumPick

  return (
    <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-glow-amber">AI Model Advisor</p>
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

      <div className="mt-4 grid grid-cols-3 gap-3">
        <BudgetPickCard
          pick={advisorCheapPick}
          label="Cheap"
          accentClass="border-emerald-500/30"
        />
        <BudgetPickCard
          pick={advisorBalancedPick}
          label="Balanced"
          accentClass="border-amber-500/30"
        />
        <BudgetPickCard
          pick={advisorPremiumPick}
          label="Premium"
          accentClass="border-purple-500/30"
        />
      </div>

      {currentPick.modelName && (
        <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2">
          <p className="text-xs font-medium text-slate-300">
            Why {currentPick.modelName} for {budgetMode}?
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-400">
            {currentPick.reasons.slice(0, 3).map((reason, index) => (
              <li key={`${index}-${reason}`}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {!currentPick.modelName && (
        <p className="mt-3 text-sm text-slate-400">No model advice yet. Generate a prompt and request AI advice.</p>
      )}

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
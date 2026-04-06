import { Sparkles, Copy, Edit3, Save, ArrowRight } from 'lucide-react'
import PromptDiffView from '../PromptDiffView'

type PromptViewTab = 'final' | 'diff'
type NegativePromptViewTab = 'final' | 'diff'

type ImprovementSectionProps = {
  generatedPrompt: string
  setGeneratedPrompt: (value: string) => void
  negativePrompt: string
  setNegativePrompt: (value: string) => void
  improvementDiff: { originalPrompt: string; improvedPrompt: string } | null
  setImprovementDiff: (value: { originalPrompt: string; improvedPrompt: string } | null) => void
  negativeImprovementDiff: { originalPrompt: string; improvedPrompt: string } | null
  setNegativeImprovementDiff: (value: { originalPrompt: string; improvedPrompt: string } | null) => void
  promptViewTab: PromptViewTab
  setPromptViewTab: (value: PromptViewTab) => void
  negativePromptViewTab: NegativePromptViewTab
  setNegativePromptViewTab: (value: NegativePromptViewTab) => void
  improving: boolean
  setImproving: (value: boolean) => void
  handleImprovePrompt: () => void
  handleImproveNegativePrompt: () => void
  handleCopyPrompt: () => void
  handleCopyNegativePrompt: () => void
  loading: boolean
  generatingNegative: boolean
  improvingNegative: boolean
  savedTitle: string
  handleSaveToLibrary: () => void
  supportsNegativePrompt: boolean | null
}

export default function ImprovementSection({
  generatedPrompt,
  setGeneratedPrompt,
  negativePrompt,
  setNegativePrompt,
  improvementDiff,
  setImprovementDiff,
  negativeImprovementDiff,
  setNegativeImprovementDiff,
  promptViewTab,
  setPromptViewTab,
  negativePromptViewTab,
  setNegativePromptViewTab,
  improving,
  handleImprovePrompt,
  handleImproveNegativePrompt,
  handleCopyPrompt,
  handleCopyNegativePrompt,
  loading,
  generatingNegative,
  improvingNegative,
  savedTitle,
  handleSaveToLibrary,
  supportsNegativePrompt,
}: ImprovementSectionProps) {
  const showNegativePromptControls = supportsNegativePrompt !== false

  return (
    <>
      {/* Generated Output Card */}
      <div className="card mt-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Generated Prompt</h2>
          <span className="text-[10px] text-slate-500">{generatedPrompt.length} characters</span>
        </div>

        <textarea
          className="textarea mt-3 min-h-32"
          value={generatedPrompt}
          onChange={(e) => setGeneratedPrompt(e.target.value)}
          placeholder="Your generated prompt will appear here."
        />

        {/* Compact Action Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={!generatedPrompt}
            className="btn-compact-ghost"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Prompt
          </button>
          <button
            type="button"
            onClick={handleCopyNegativePrompt}
            disabled={!negativePrompt}
            className="btn-compact-ghost"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Negative
          </button>
          <button
            type="button"
            className="btn-compact-ghost"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit in Manual
          </button>
          <button
            onClick={handleSaveToLibrary}
            disabled={!generatedPrompt || !savedTitle.trim() || generatingNegative || improvingNegative}
            className="btn-save-library-main"
          >
            <Save className="w-3.5 h-3.5" /> Save to Library
          </button>
          <button
            type="button"
            className="btn-compact-ghost ml-auto"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Guided Mode
          </button>
        </div>

        {/* Negative Prompt Section */}
        {showNegativePromptControls && negativePrompt && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide">Negative Prompt</h3>
              <span className="text-[10px] text-slate-500">{negativePrompt.length} chars</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{negativePrompt}</p>
          </div>
        )}
      </div>

      {/* Improve Prompt Section - Teal styled */}
      <div className="mt-4 card border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-500/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <p className="text-sm font-semibold text-teal-300">Verbeter Prompt</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              disabled={!(improvementDiff?.improvedPrompt ?? generatedPrompt).trim() || loading || improving || generatingNegative || improvingNegative}
              className="btn-compact-ghost"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Prompt
            </button>
            <button
              type="button"
              onClick={handleImprovePrompt}
              disabled={!generatedPrompt.trim() || loading || improving || generatingNegative || improvingNegative}
              className="btn-compact-teal"
            >
              {improving ? 'Improving...' : 'Improve Prompt'}
            </button>
          </div>
        </div>

        {improvementDiff && (
          <div className="mt-4">
            <div className="inline-flex rounded-lg border border-slate-700/50 bg-slate-900/40 p-1">
              <button
                type="button"
                onClick={() => setPromptViewTab('diff')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${promptViewTab === 'diff' ? 'bg-glow-purple text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Diff View
              </button>
              <button
                type="button"
                onClick={() => setPromptViewTab('final')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${promptViewTab === 'final' ? 'bg-glow-purple text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Final Result
              </button>
            </div>

            {promptViewTab === 'diff' ? (
              <PromptDiffView
                originalPrompt={improvementDiff.originalPrompt}
                improvedPrompt={improvementDiff.improvedPrompt}
              />
            ) : (
              <textarea
                className="textarea mt-3 min-h-32"
                value={improvementDiff.improvedPrompt}
                readOnly
                placeholder="Improved prompt result"
              />
            )}
          </div>
        )}
      </div>

      {/* Negative Prompt Improvement Section */}
      {showNegativePromptControls && negativeImprovementDiff && (
        <div className="mt-4 card border-red-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-red-500/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-300">Improve Negative Prompt</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyNegativePrompt}
                disabled={!negativeImprovementDiff.improvedPrompt.trim() || loading || improving || generatingNegative || improvingNegative}
                className="btn-compact-ghost"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Negative
              </button>
              <button
                type="button"
                onClick={handleImproveNegativePrompt}
                disabled={!negativePrompt.trim() || loading || improving || generatingNegative || improvingNegative}
                className="btn-compact-red"
              >
                {improvingNegative ? 'Improving...' : 'Improve Negative'}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="inline-flex rounded-lg border border-slate-700/50 bg-slate-900/40 p-1">
              <button
                type="button"
                onClick={() => setNegativePromptViewTab('diff')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${negativePromptViewTab === 'diff' ? 'bg-glow-purple text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Diff View
              </button>
              <button
                type="button"
                onClick={() => setNegativePromptViewTab('final')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${negativePromptViewTab === 'final' ? 'bg-glow-purple text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Final Result
              </button>
            </div>

            {negativePromptViewTab === 'diff' ? (
              <PromptDiffView
                originalPrompt={negativeImprovementDiff.originalPrompt}
                improvedPrompt={negativeImprovementDiff.improvedPrompt}
              />
            ) : (
              <textarea
                className="textarea mt-3 min-h-32"
                value={negativeImprovementDiff.improvedPrompt}
                readOnly
                placeholder="Improved negative prompt result"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
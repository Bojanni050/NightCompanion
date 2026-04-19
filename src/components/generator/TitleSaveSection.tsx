import { Save } from 'lucide-react'

type TitleSaveSectionProps = {
  savedTitle: string
  setSavedTitle: (value: string) => void
  savePromptMode: 'original-only' | 'original-and-improved'
  setSavePromptMode: (value: 'original-only' | 'original-and-improved') => void
  generatedPrompt: string
  negativePrompt: string
  generatingTitle: boolean
  setGeneratingTitle: (value: boolean) => void
  handleGenerateTitle: () => void
  handleSaveToLibrary: () => void

  loading: boolean
  improving: boolean
  generatingNegative: boolean
  improvingNegative: boolean
}

export default function TitleSaveSection({
  savedTitle,
  setSavedTitle,
  savePromptMode,
  setSavePromptMode,
  generatedPrompt,
  generatingTitle,
  handleGenerateTitle,
  handleSaveToLibrary,

  loading,
  improving,
  generatingNegative,
  improvingNegative,
}: TitleSaveSectionProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          type="text"
          value={savedTitle}
          onChange={(e) => setSavedTitle(e.target.value)}
          className="input"
          placeholder="Title to save in Prompt Library"
        />
        <button
          type="button"
          onClick={handleGenerateTitle}
          disabled={!generatedPrompt.trim() || loading || improving || generatingNegative || improvingNegative || generatingTitle}
          className="btn-compact-primary"
        >
          {generatingTitle ? 'Generating title...' : 'Generate Title (AI)'}
        </button>
        <select
          value={savePromptMode}
          onChange={(e) => setSavePromptMode(e.target.value as 'original-only' | 'original-and-improved')}
          className="input"
          aria-label="Save mode"
        >
          <option value="original-only">Save: original only</option>
          <option value="original-and-improved">Save: original + improved (if available)</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSaveToLibrary}
          disabled={!generatedPrompt.trim() || generatingNegative || improvingNegative}
          className="btn-save-library-secondary"
        >
          <Save className="w-3.5 h-3.5" /> Save to Library
        </button>
      </div>
    </div>
  )
}
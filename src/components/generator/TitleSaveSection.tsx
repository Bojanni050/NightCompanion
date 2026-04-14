import { Save } from 'lucide-react'

type TitleSaveSectionProps = {
  savedTitle: string
  setSavedTitle: (value: string) => void
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
      <input
        type="text"
        value={savedTitle}
        onChange={(e) => setSavedTitle(e.target.value)}
        className="input"
        placeholder="Title to save in Prompt Library"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateTitle}
          disabled={!generatedPrompt.trim() || loading || improving || generatingNegative || improvingNegative || generatingTitle}
          className="btn-compact-primary"
        >
          {generatingTitle ? 'Generating title...' : 'Generate Title (AI)'}
        </button>
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
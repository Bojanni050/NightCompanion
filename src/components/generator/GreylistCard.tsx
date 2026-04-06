type GreylistCardProps = {
  greylistEnabled: boolean
  setGreylistEnabled: (value: boolean) => void
  greylistWords: string[]
  setGreylistWords: (value: string[]) => void
  greylistInput: string
  setGreylistInput: (value: string) => void
  addGreylistWord: () => void
  removeGreylistWord: (word: string) => void
}

const GREYLIST_SUGGESTIONS = [
  'jellyfish',
  'neon',
  'cyber',
  'glowing',
  'futuristic',
  'holographic',
  'sci-fi',
  'chrome',
  'vaporwave',
  'laser',
]

export default function GreylistCard({
  greylistEnabled,
  setGreylistEnabled,
  greylistWords,
  setGreylistWords,
  greylistInput,
  setGreylistInput,
  addGreylistWord,
  removeGreylistWord,
}: GreylistCardProps) {
  const normalizeGreylistWord = (value: string) => value.trim().toLowerCase()

  const greylistSuggestions = GREYLIST_SUGGESTIONS.filter((item) => {
    const normalizedInput = normalizeGreylistWord(greylistInput)
    if (!normalizedInput) return !greylistWords.includes(item)
    return item.includes(normalizedInput) && !greylistWords.includes(item)
  })

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Greylist</h2>
          <p className="text-xs text-slate-500 mt-1">Words the AI should try to avoid or use with low probability.</p>
        </div>
        <label className={`inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs font-medium transition-colors ${greylistEnabled ? 'border-green-500/60 bg-green-500/20 text-green-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
          <input
            type="checkbox"
            checked={greylistEnabled}
            onChange={(e) => setGreylistEnabled(e.target.checked)}
            className="mr-1 h-3.5 w-3.5 accent-green-500"
            aria-label="Enable greylist"
          />
          {greylistEnabled ? 'On' : 'Off'}
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <div>
          <input
            type="text"
            list="generator-greylist-suggestions"
            value={greylistInput}
            onChange={(e) => setGreylistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              addGreylistWord()
            }}
            className="input"
            placeholder="Add word to greylist"
          />
          <datalist id="generator-greylist-suggestions">
            {greylistSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <button type="button" onClick={addGreylistWord} className="btn-ghost border border-slate-700/50">
          Add
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {greylistWords.length === 0 ? (
          <p className="text-xs text-slate-500">No greylist words added.</p>
        ) : (
          greylistWords.map((word) => (
            <span key={word} className="tag-removable">
              {word}
              <button
                type="button"
                onClick={() => removeGreylistWord(word)}
                className="rounded px-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                aria-label={`Remove ${word}`}
              >
                x
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}
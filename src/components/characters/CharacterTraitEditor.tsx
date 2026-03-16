import { Check, Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import type { CharacterDetail } from './types'

type CharacterTraitEditorProps = {
  detailText: string
  detailCategory: string
  detailWorks: boolean
  formDetails: CharacterDetail[]
  onDetailTextChange: (value: string) => void
  onDetailCategoryChange: (value: string) => void
  onDetailWorksChange: (value: boolean) => void
  onAddTrait: () => void
  onRemoveTrait: (id: string) => void
}

export default function CharacterTraitEditor({
  detailText,
  detailCategory,
  detailWorks,
  formDetails,
  onDetailTextChange,
  onDetailCategoryChange,
  onDetailWorksChange,
  onAddTrait,
  onRemoveTrait,
}: CharacterTraitEditorProps) {
  return (
    <div className="pt-4 border-t border-night-700 space-y-3">
      <label className="label">Character Traits</label>

      <div className="card p-3 border-night-700 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={detailText}
            onChange={(e) => onDetailTextChange(e.target.value)}
            placeholder="e.g. Wears a leather jacket"
            className="input"
          />
          <select
            value={detailCategory}
            onChange={(e) => onDetailCategoryChange(e.target.value)}
            className="input w-36"
            title="Trait category"
          >
            <option value="clothing">Clothing</option>
            <option value="lighting">Lighting</option>
            <option value="pose">Pose</option>
            <option value="style">Style</option>
            <option value="expression">Expression</option>
            <option value="environment">Environment</option>
            <option value="appearance">Appearance</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg border border-night-700 overflow-hidden">
            <button
              type="button"
              onClick={() => onDetailWorksChange(true)}
              className={`px-2 py-1.5 ${detailWorks ? 'bg-emerald-600/20 text-emerald-400' : 'bg-night-800 text-night-400'}`}
              title="Works well"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDetailWorksChange(false)}
              className={`px-2 py-1.5 ${!detailWorks ? 'bg-red-600/20 text-red-400' : 'bg-night-800 text-night-400'}`}
              title="Issues reported"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button type="button" onClick={onAddTrait} className="btn-ghost border border-night-700">
            <Plus className="w-3.5 h-3.5" />
            Add Trait
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-44 overflow-y-auto">
        {formDetails.length === 0 ? (
          <div className="text-xs text-night-500 italic py-2">No traits added yet.</div>
        ) : (
          formDetails.map((detail) => (
            <div
              key={detail.id}
              className="flex items-center justify-between rounded-lg border border-night-700 p-2 bg-night-900"
            >
              <div className="flex items-center gap-2 min-w-0">
                {detail.worksWell ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-xs text-night-200 truncate">{detail.detail}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-night-400 uppercase">
                  {detail.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveTrait(detail.id)}
                className="text-night-500 hover:text-red-400"
                title="Remove trait"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { Check, X } from 'lucide-react'
import type { CharacterDetail } from './types'

type CharacterDetailPanelProps = {
  details: CharacterDetail[]
}

export default function CharacterDetailPanel({ details }: CharacterDetailPanelProps) {
  return (
    <div className="border-t border-night-700 p-5 pt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
      <h4 className="text-xs uppercase tracking-wide text-night-500">Traits</h4>
      {details.length === 0 ? (
        <div className="text-xs italic text-night-600">No traits recorded.</div>
      ) : (
        details.map((detail) => (
          <div key={detail.id} className="flex items-center gap-2 text-xs text-night-200">
            {detail.worksWell ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="truncate">{detail.detail}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-night-400">
              {detail.category}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

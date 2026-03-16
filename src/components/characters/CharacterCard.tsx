import { Edit3, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { CharacterRecord } from './types'
import CharacterDetailPanel from './CharacterDetailPanel'

type CharacterCardProps = {
  character: CharacterRecord
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onViewImage: (url: string) => void
}

export default function CharacterCard({
  character,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onViewImage,
}: CharacterCardProps) {
  const mainImage = character.images.find((image) => image.isMain) || character.images[0]
  const additionalImages = character.images.filter((image) => image.id !== mainImage?.id)

  return (
    <div
      className={`card border-night-700 hover:border-night-500 transition-all overflow-hidden cursor-pointer ${isExpanded ? 'ring-1 ring-glow-purple/50' : ''}`}
      onClick={onToggleExpand}
    >
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{character.name}</h3>
            <span className="text-[10px] text-glow-soft">Character</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-1.5 rounded-lg hover:bg-night-800 text-night-400 hover:text-night-100"
              title="Edit character"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1.5 rounded-lg hover:bg-red-900/30 text-night-400 hover:text-red-300"
              title="Delete character"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-night-400 line-clamp-3 min-h-[3rem]">
          {character.description || 'No description provided.'}
        </p>
      </div>

      <div className="px-5 pb-5">
        <div
          className="relative aspect-square rounded-xl overflow-hidden bg-night-950 border border-night-800"
          onClick={(e) => {
            e.stopPropagation()
            if (mainImage?.url) onViewImage(mainImage.url)
          }}
        >
          {mainImage?.url ? (
            <img src={mainImage.url} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-night-700">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}
          {mainImage?.url && (
            <div className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-glow-purple/80 text-white uppercase">
              Main
            </div>
          )}
        </div>

        {additionalImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {additionalImages.slice(0, 4).map((image) => (
              <button
                key={image.id}
                className="aspect-square rounded-md overflow-hidden border border-night-800"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewImage(image.url)
                }}
                title="View image"
              >
                <img src={image.url} alt="Character gallery" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {isExpanded && <CharacterDetailPanel details={character.details} />}
    </div>
  )
}

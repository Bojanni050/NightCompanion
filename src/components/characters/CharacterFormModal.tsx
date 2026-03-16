import type { ChangeEvent, RefObject } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import CharacterImageUploader from './CharacterImageUploader'
import CharacterTraitEditor from './CharacterTraitEditor'
import type { CharacterDetail, CharacterImage } from './types'

type CharacterFormModalProps = {
  mode: 'create' | 'edit'
  saving: boolean
  uploading: boolean
  formName: string
  formDesc: string
  formImages: CharacterImage[]
  formDetails: CharacterDetail[]
  detailText: string
  detailCategory: string
  detailWorks: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  onSave: () => void
  onFormNameChange: (value: string) => void
  onFormDescChange: (value: string) => void
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onSetMainImage: (id: string) => void
  onRemoveImage: (image: CharacterImage) => void
  onDetailTextChange: (value: string) => void
  onDetailCategoryChange: (value: string) => void
  onDetailWorksChange: (value: boolean) => void
  onAddTrait: () => void
  onRemoveTrait: (id: string) => void
}

export default function CharacterFormModal({
  mode,
  saving,
  uploading,
  formName,
  formDesc,
  formImages,
  formDetails,
  detailText,
  detailCategory,
  detailWorks,
  fileInputRef,
  onClose,
  onSave,
  onFormNameChange,
  onFormDescChange,
  onImageUpload,
  onSetMainImage,
  onRemoveImage,
  onDetailTextChange,
  onDetailCategoryChange,
  onDetailWorksChange,
  onAddTrait,
  onRemoveTrait,
}: CharacterFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl card border-night-700 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-night-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {mode === 'edit' ? 'Edit Character' : 'New Character'}
          </h3>
          <button onClick={onClose} className="text-night-400 hover:text-white" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Name</label>
            <input
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="e.g. Cyberpunk Detective"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => onFormDescChange(e.target.value)}
              placeholder="Core traits, visual style, personality..."
              className="textarea min-h-24"
            />
          </div>

          <CharacterImageUploader
            formImages={formImages}
            uploading={uploading}
            fileInputRef={fileInputRef}
            onImageUpload={onImageUpload}
            onSetMainImage={onSetMainImage}
            onRemoveImage={onRemoveImage}
          />

          <CharacterTraitEditor
            detailText={detailText}
            detailCategory={detailCategory}
            detailWorks={detailWorks}
            formDetails={formDetails}
            onDetailTextChange={onDetailTextChange}
            onDetailCategoryChange={onDetailCategoryChange}
            onDetailWorksChange={onDetailWorksChange}
            onAddTrait={onAddTrait}
            onRemoveTrait={onRemoveTrait}
          />
        </div>

        <div className="px-6 py-4 border-t border-night-700 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={onSave} disabled={saving || !formName.trim()} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Character
          </button>
        </div>
      </div>
    </div>
  )
}

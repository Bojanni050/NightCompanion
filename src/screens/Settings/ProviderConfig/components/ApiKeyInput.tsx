import { Eye, EyeOff, Loader2 } from 'lucide-react'
import type { ApiKeyInputProps } from '../types'

export function ApiKeyInput({
  provider,
  keyInfo,
  inputValue,
  setInputValue,
  isEditing,
  setIsEditing,
  showKey,
  setShowKey,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
  onTest,
  isTesting,
}: ApiKeyInputProps) {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          type="password"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={provider.placeholder}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
        />
        <button
          onClick={onTest}
          disabled={isTesting}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border border-slate-700 hover:border-slate-600"
          title="Test Connection"
        >
          {isTesting ? <Loader2 size={14} className="animate-spin" /> : 'Test'}
        </button>
        <button
          onClick={onSave}
          disabled={isSaving || !inputValue.trim()}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save Key'}
        </button>
        {keyInfo && (
          <button
            onClick={() => {
              setIsEditing(false)
              setInputValue('')
            }}
            className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
      <div className="flex-1 font-mono text-sm text-slate-400">
        {showKey ? keyInfo?.key_hint || keyInfo?.apiKeyMasked : '••••••••••••••••••••••••'}
      </div>
      <button onClick={() => setShowKey(!showKey)} className="text-slate-500 hover:text-slate-300 p-1">
        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <div className="w-px h-4 bg-slate-700 mx-1" />
      <button
        onClick={onTest}
        disabled={isTesting}
        className="text-slate-400 hover:text-white text-xs font-medium px-2"
        title="Test Connection"
      >
        {isTesting ? <Loader2 size={12} className="animate-spin" /> : 'Test'}
      </button>
      <div className="w-px h-4 bg-slate-700 mx-1" />
      <button
        onClick={() => {
          setIsEditing(true)
          setInputValue('')
        }}
        className="text-teal-400 hover:text-teal-300 text-xs font-medium px-2"
      >
        Change
      </button>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="text-red-400 hover:text-red-300 text-xs font-medium px-2 disabled:opacity-50"
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
      </button>
    </div>
  )
}

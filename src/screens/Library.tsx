import { useState, useEffect, useCallback } from 'react'
import type { Prompt } from '../types'
import PromptCard from '../components/PromptCard'
import PromptForm from '../components/PromptForm'
import SearchBar from '../components/SearchBar'

type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; prompt: Prompt }

export default function Library() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await window.electronAPI.prompts.list({
      search: search || undefined,
      model: modelFilter || undefined,
    })
    if (result.error) {
      setError(result.error)
    } else {
      setPrompts(result.data!)
    }
    setLoading(false)
  }, [search, modelFilter])

  useEffect(() => {
    const timeout = setTimeout(fetchPrompts, 200)
    return () => clearTimeout(timeout)
  }, [fetchPrompts])

  const handleCreate = async (data: Parameters<typeof window.electronAPI.prompts.create>[0]) => {
    const result = await window.electronAPI.prompts.create(data)
    if (result.error) return result.error
    await fetchPrompts()
    setForm({ mode: 'closed' })
    return null
  }

  const handleUpdate = async (
    id: number,
    data: Parameters<typeof window.electronAPI.prompts.update>[1]
  ) => {
    const result = await window.electronAPI.prompts.update(id, data)
    if (result.error) return result.error
    await fetchPrompts()
    setForm({ mode: 'closed' })
    return null
  }

  const handleDelete = async (id: number) => {
    const result = await window.electronAPI.prompts.delete(id)
    if (result.error) {
      setError(result.error)
      return
    }
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    if (form.mode === 'edit' && form.prompt.id === id) {
      setForm({ mode: 'closed' })
    }
  }

  const allModels = [...new Set(prompts.map((p) => p.model).filter(Boolean))].sort()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Prompt Library</h1>
          <p className="text-sm text-night-400 mt-0.5">
            {loading ? 'Loading…' : `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setForm({ mode: 'create' })}
          className="btn-primary"
        >
          <span className="text-lg leading-none">+</span>
          New Prompt
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 px-8 pb-5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search prompts…"
          className="flex-1"
        />
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="input w-48"
        >
          <option value="">All models</option>
          {allModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-8 pb-8"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/50 border border-red-800/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-night-500 text-sm animate-pulse">Loading prompts…</div>
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState onNew={() => setForm({ mode: 'create' })} hasFilters={!!(search || modelFilter)} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => setForm({ mode: 'edit', prompt })}
                onDelete={() => handleDelete(prompt.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {form.mode !== 'closed' && (
        <PromptForm
          initial={form.mode === 'edit' ? form.prompt : undefined}
          onSubmit={(data) =>
            form.mode === 'edit'
              ? handleUpdate(form.prompt.id, data)
              : handleCreate(data)
          }
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}
    </div>
  )
}

function EmptyState({ onNew, hasFilters }: { onNew: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-night-800 border border-night-600/50 flex items-center justify-center mb-4 shadow-glow-sm">
        <span className="text-3xl text-night-500">✦</span>
      </div>
      <h3 className="text-lg font-medium text-night-200 mb-1">
        {hasFilters ? 'No prompts match your search' : 'No prompts yet'}
      </h3>
      <p className="text-sm text-night-500 mb-5 max-w-sm">
        {hasFilters
          ? 'Try adjusting your filters or search terms.'
          : 'Start building your creative library by saving your first prompt.'}
      </p>
      {!hasFilters && (
        <button onClick={onNew} className="btn-primary">
          <span className="text-lg leading-none">+</span>
          Add your first prompt
        </button>
      )}
    </div>
  )
}

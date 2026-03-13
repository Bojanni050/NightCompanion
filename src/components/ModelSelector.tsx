import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ModelOption } from '../screens/Settings/types'

interface ProviderInfo {
  id: string
  name: string
  type: 'cloud' | 'local'
}

interface ModelSelectorProps {
  value: string
  onChange: (id: string) => void
  models: ModelOption[]
  providers?: ProviderInfo[]
  placeholder?: string
  className?: string
  sortMode?: 'cheapest' | 'alphabetical'
}

function getCombinedPrice(model: Pick<ModelOption, 'promptPrice' | 'completionPrice'>): number {
  const prompt = Number(model.promptPrice || '')
  const completion = Number(model.completionPrice || '')

  if (!Number.isFinite(prompt) || !Number.isFinite(completion))
    return Number.POSITIVE_INFINITY

  return prompt + completion
}

export default function ModelSelector({ value, onChange, models, placeholder, className, sortMode = 'alphabetical' }: ModelSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const sortedModels = useMemo(() => {
    return [...models].sort((first, second) => {
      if (sortMode === 'cheapest') {
        const firstPrice = getCombinedPrice(first)
        const secondPrice = getCombinedPrice(second)
        if (firstPrice !== secondPrice)
          return firstPrice - secondPrice
      }

      const firstLabel = first.label || first.name || first.id
      const secondLabel = second.label || second.name || second.id
      return firstLabel.localeCompare(secondLabel)
    })
  }, [models, sortMode])

  const selectedModel = useMemo(
    () => sortedModels.find((model) => model.id === value),
    [sortedModels, value]
  )

  useEffect(() => {
    const selectedLabel = selectedModel?.label || selectedModel?.name || selectedModel?.id || ''
    setQuery(selectedLabel)
  }, [selectedModel])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current)
        return

      if (containerRef.current.contains(event.target as Node))
        return

      setIsOpen(false)
      setHighlightedIndex(0)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle)
      return sortedModels

    return sortedModels.filter((model) => {
      const label = (model.label || model.name || model.id).toLowerCase()
      return label.includes(needle) || model.id.toLowerCase().includes(needle)
    })
  }, [sortedModels, query])

  useEffect(() => {
    if (highlightedIndex >= filteredModels.length)
      setHighlightedIndex(0)
  }, [filteredModels, highlightedIndex])

  function selectModel(model: ModelOption) {
    onChange(model.id)
    setQuery(model.label || model.name || model.id)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (!isOpen)
      return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((previous) => (previous + 1) % Math.max(filteredModels.length, 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((previous) => (previous - 1 + Math.max(filteredModels.length, 1)) % Math.max(filteredModels.length, 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const highlightedModel = filteredModels[highlightedIndex]
      if (highlightedModel)
        selectModel(highlightedModel)
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(0)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className || ''}`.trim()}>
      <input
        className="input w-full"
        value={query}
        placeholder={placeholder || 'Search model...'}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          setHighlightedIndex(0)
        }}
        onKeyDown={onInputKeyDown}
        aria-label="Model selector"
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={isOpen}
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          {filteredModels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">No models found</div>
          ) : (
            filteredModels.map((model, index) => {
              const label = model.label || model.name || model.id
              const isHighlighted = index === highlightedIndex
              const isSelected = model.id === value

              return (
                <button
                  key={model.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${isHighlighted ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'} ${isSelected ? 'font-medium' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    selectModel(model)
                  }}
                >
                  {label}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

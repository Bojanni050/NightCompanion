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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

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

  const selectedModelName = selectedModel?.displayName || selectedModel?.name || selectedModel?.label || selectedModel?.id || ''

  useEffect(() => {
    setQuery(selectedModelName)
  }, [selectedModelName])

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
      const modelName = (model.displayName || model.name || model.label || model.id).toLowerCase()
      const description = (model.description || '').toLowerCase()
      return modelName.includes(needle) || description.includes(needle) || model.id.toLowerCase().includes(needle)
    })
  }, [sortedModels, query])

  useEffect(() => {
    if (highlightedIndex >= filteredModels.length)
      setHighlightedIndex(0)
  }, [filteredModels, highlightedIndex])

  function selectModel(model: ModelOption) {
    onChange(model.id)
    setQuery(model.displayName || model.name || model.label || model.id)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true)
      setQuery('')
      setHighlightedIndex(0)
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
        onFocus={() => {
          setIsOpen(true)
          setQuery('')
          setHighlightedIndex(0)
        }}
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
              const modelName = model.displayName || model.name || model.label || model.id
              const priceLabel = model.priceLabel || '—'
              const description = model.description?.trim() || 'Geen beschrijving beschikbaar.'
              const isExpanded = Boolean(expandedDescriptions[model.id])
              const showReadMore = description.length > 120
              const isHighlighted = index === highlightedIndex
              const isSelected = model.id === value

              return (
                <div
                  key={model.id}
                  role="button"
                  tabIndex={-1}
                  className={`w-full px-3 py-2 text-left transition-colors cursor-pointer ${isHighlighted ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'} ${isSelected ? 'font-medium' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    selectModel(model)
                  }}
                >
                  <div className="text-sm">
                    <span className="text-teal-300">{priceLabel}</span>
                    <span className="text-slate-500 px-1">|</span>
                    <span>{modelName}</span>
                  </div>
                  <div
                    className={`mt-1 text-xs text-slate-400 ${isExpanded ? '' : 'overflow-hidden'}`}
                    style={isExpanded
                      ? undefined
                      : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {description}
                  </div>
                  {showReadMore && (
                    <button
                      type="button"
                      className="mt-1 text-xs text-teal-400 hover:text-teal-300"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setExpandedDescriptions((previous) => ({
                          ...previous,
                          [model.id]: !previous[model.id],
                        }))
                      }}
                    >
                      {isExpanded ? 'Lees minder' : 'Lees meer'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

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

function getProviderDisplayName(provider: string | undefined): string {
  if (!provider) return ''
  const map: Record<string, string> = {
    openrouter: 'OpenRouter',
    ollama: 'Ollama',
    lmstudio: 'LM Studio',
  }
  return map[provider.toLowerCase()] ?? (provider.charAt(0).toUpperCase() + provider.slice(1))
}

export default function ModelSelector({ value, onChange, models, placeholder, className, sortMode = 'alphabetical' }: ModelSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
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
  const selectedPriceLabel = selectedModel?.priceLabel || ''
  const selectedProviderName = getProviderDisplayName(selectedModel?.provider)

  // Auto-focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [isOpen])

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

  function openDropdown() {
    setIsOpen(true)
    setQuery('')
    setHighlightedIndex(0)
  }

  function selectModel(model: ModelOption) {
    onChange(model.id)
    setIsOpen(false)
    setQuery('')
    setHighlightedIndex(0)
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
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
      {/* Card-style button trigger */}
      <button
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-left hover:border-slate-600 transition-colors"
      >
        {selectedPriceLabel && (
          <span className="text-xs text-teal-300 shrink-0 font-mono">{selectedPriceLabel}</span>
        )}
        {selectedPriceLabel && (
          <span className="text-slate-600 shrink-0">|</span>
        )}
        <span className="flex-1 min-w-0">
          {selectedModelName
            ? (
              <>
                <span className="block text-sm font-medium text-white truncate">{selectedModelName}</span>
                {selectedProviderName && (
                  <span className="block text-xs text-slate-400 truncate">{selectedProviderName}</span>
                )}
              </>
            )
            : (
              <span className="block text-sm text-slate-400">{placeholder || 'Select a model...'}</span>
            )}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl flex flex-col max-h-80">
          {/* Search input inside dropdown */}
          <div className="px-3 py-2 border-b border-slate-700 shrink-0">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search models..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Model list */}
          <div className="overflow-auto">
            {filteredModels.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No models found</div>
            ) : (
              filteredModels.map((model, index) => {
                const modelName = model.displayName || model.name || model.label || model.id
                const priceLabel = model.priceLabel || ''
                const providerName = getProviderDisplayName(model.provider)
                const description = model.description?.trim() || ''
                const isVision = model.capabilities?.some(c => c.toLowerCase() === 'vision') ?? false
                const isExpanded = Boolean(expandedDescriptions[model.id])
                const showReadMore = description.length > 120
                const isHighlighted = index === highlightedIndex
                const isSelected = model.id === value

                return (
                  <div
                    key={model.id}
                    role="button"
                    tabIndex={-1}
                    className={`w-full px-3 py-2.5 text-left transition-colors cursor-pointer border-b border-slate-800 last:border-0 ${isHighlighted ? 'bg-slate-800' : 'hover:bg-slate-800/60'} ${isSelected ? 'bg-slate-800/40' : ''}`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      selectModel(model)
                    }}
                  >
                    {/* Model name + price */}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-100'} truncate flex-1`}>
                        {modelName}
                      </span>
                      {priceLabel && (
                        <span className="text-xs text-teal-300 shrink-0 font-mono">{priceLabel}</span>
                      )}
                    </div>

                    {/* Provider + capability badges */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {providerName && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/20 leading-none">
                          {providerName}
                        </span>
                      )}
                      {isVision && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/15 text-teal-300 border border-teal-500/20 leading-none">
                          Vision
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {description && (
                      <>
                        <div
                          className={`mt-1.5 text-xs text-slate-400 ${isExpanded ? '' : 'overflow-hidden'}`}
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
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

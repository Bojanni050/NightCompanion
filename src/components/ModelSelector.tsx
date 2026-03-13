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

function formatPerMillion(priceText: string | null | undefined): string | null {
  if (!priceText) return null

  const parsed = Number(priceText)
  if (!Number.isFinite(parsed)) return null

  const perMillion = parsed * 1_000_000
  if (perMillion >= 1) return `$${perMillion.toFixed(2)}`

  return `$${perMillion.toFixed(4)}`
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
      <button
        type="button"
        onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="group flex items-center gap-2 w-full rounded-2xl border border-cyan-500/35 bg-slate-800/90 px-3 py-2.5 text-left hover:border-cyan-400/50 transition-colors"
      >
        <span className="w-16 shrink-0 text-[11px] leading-4 text-teal-300 font-semibold text-right">
          {selectedPriceLabel || 'Free'}
        </span>
        <span className="flex-1 min-w-0">
          {selectedModelName
            ? (
              <>
                <span className="block text-sm font-semibold text-white truncate">{selectedModelName}</span>
                {selectedProviderName && (
                  <span className="block text-xs text-slate-400 truncate">• {selectedProviderName.toLowerCase()}</span>
                )}
              </>
            )
            : (
              <span className="block text-sm text-slate-400">{placeholder || 'Select a model...'}</span>
            )}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 group-hover:text-slate-300 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[26rem] p-3">
          <div className="px-1 pb-2 shrink-0">
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="overflow-auto pr-1 space-y-2">
            {filteredModels.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No models found</div>
            ) : (
              filteredModels.map((model, index) => {
                const modelName = model.displayName || model.name || model.label || model.id
                const priceLabel = model.priceLabel || ''
                const providerName = getProviderDisplayName(model.provider)
                const description = model.description?.trim() || ''
                const capabilityTags = model.capabilities ?? []
                const promptPerMillion = formatPerMillion(model.promptPrice)
                const completionPerMillion = formatPerMillion(model.completionPrice)
                const isExpanded = Boolean(expandedDescriptions[model.id])
                const showReadMore = description.length > 120
                const isHighlighted = index === highlightedIndex
                const isSelected = model.id === value

                return (
                  <div
                    key={model.id}
                    role="button"
                    tabIndex={-1}
                    className={`rounded-2xl border p-3 transition-colors cursor-pointer ${
                      isHighlighted ? 'border-cyan-500/55 bg-slate-800/80' : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/60'
                    } ${isSelected ? 'ring-1 ring-cyan-500/40' : ''}`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      selectModel(model)
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 shrink-0 text-[11px] text-slate-400 leading-5 pt-1">
                        <div>In: <span className="text-cyan-300">{promptPerMillion || '—'}</span></div>
                        <div>Out: <span className="text-cyan-300">{completionPerMillion || '—'}</span></div>
                      </div>

                      <div className="min-w-0 flex-1 border-l border-slate-700 pl-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-100'} truncate`}>
                            {modelName}
                          </span>
                          {priceLabel && <span className="text-[11px] text-teal-300 shrink-0">{priceLabel}</span>}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {providerName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/25 leading-none">
                              ● {providerName.toLowerCase()}
                            </span>
                          )}
                          {capabilityTags.map((capability) => {
                            const normalized = capability.toLowerCase()
                            const isReasoning = normalized.includes('reason')
                            const isVision = normalized.includes('vision') || normalized.includes('image')
                            const chipClass = isReasoning
                              ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25'
                              : isVision
                                ? 'bg-teal-500/15 text-teal-300 border-teal-500/25'
                                : 'bg-slate-500/15 text-slate-200 border-slate-500/25'

                            return (
                              <span key={`${model.id}-${capability}`} className={`px-2 py-0.5 rounded-md text-[10px] border leading-none ${chipClass}`}>
                                {capability}
                              </span>
                            )
                          })}
                        </div>

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
                                className="mt-1 text-xs text-slate-300 hover:text-white"
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
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
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

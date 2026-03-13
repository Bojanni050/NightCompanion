import type { Dispatch, SetStateAction } from 'react'
import { BookOpen, Eye, Settings, Sparkles, Wand2 } from 'lucide-react'
import ModelSelector from '../../components/ModelSelector'
import type { ApiKeyInfo, LocalEndpoint, ModelOption } from './types'

type DashboardRole = 'generation' | 'improvement' | 'vision' | 'general'

interface RoleRouteSelection {
  enabled: boolean
  providerId: string
  modelId: string
}

interface ProviderOption {
  id: string
  label: string
}

interface DashboardProps {
  activeGen?: ApiKeyInfo | LocalEndpoint
  activeImprove?: ApiKeyInfo | LocalEndpoint
  activeVision?: ApiKeyInfo | LocalEndpoint
  activeResearch?: ApiKeyInfo | LocalEndpoint
  onConfigure: () => void
  configuredCount: number
  keys: ApiKeyInfo[]
  localEndpoints: LocalEndpoint[]
  dynamicModels: Record<string, ModelOption[]>
  setDynamicModels: Dispatch<SetStateAction<Record<string, ModelOption[]>>>
  onRefreshData: () => Promise<void>
  getToken: () => Promise<string>
  providerOptions: ProviderOption[]
  modelsByProvider: Record<string, string[]>
  roleRouting: Record<DashboardRole, RoleRouteSelection>
  onChangeRoleRouting: (role: DashboardRole, patch: Partial<RoleRouteSelection>) => void
}

const ROLE_META: Record<DashboardRole, {
  label: string
  description: string
  icon: React.ReactNode
  iconClass: string
  cardClass: string
}> = {
  generation: {
    label: 'Generation',
    description: 'Creates prompts from your ideas using advanced reasoning.',
    icon: <Sparkles className="w-5 h-5" />,
    iconClass: 'bg-amber-500/15 text-amber-300',
    cardClass: 'border-amber-500/25 bg-amber-500/5',
  },
  improvement: {
    label: 'Improvement',
    description: 'Refines and enhances your prompts with expert techniques.',
    icon: <Wand2 className="w-5 h-5" />,
    iconClass: 'bg-cyan-500/15 text-cyan-300',
    cardClass: 'border-cyan-500/25 bg-cyan-500/5',
  },
  vision: {
    label: 'Vision',
    description: 'Analyzes characters and images for style replication.',
    icon: <Eye className="w-5 h-5" />,
    iconClass: 'bg-violet-500/15 text-violet-300',
    cardClass: 'border-violet-500/25 bg-violet-500/5',
  },
  general: {
    label: 'Research & Reasoning',
    description: 'Used for style analysis, deep reasoning and recommendations.',
    icon: <BookOpen className="w-5 h-5" />,
    iconClass: 'bg-blue-500/15 text-blue-300',
    cardClass: 'border-blue-500/25 bg-blue-500/5',
  },
}

function formatProviderLabel(id: string): string {
  const MAP: Record<string, string> = {
    openrouter: 'OpenRouter',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    ollama: 'Ollama',
    lmstudio: 'LM Studio',
  }
  return MAP[id] || id.charAt(0).toUpperCase() + id.slice(1)
}

const ROLES: DashboardRole[] = ['generation', 'improvement', 'vision', 'general']

export function Dashboard({
  onConfigure,
  configuredCount,
  setDynamicModels,
  getToken,
  providerOptions,
  modelsByProvider,
  roleRouting,
  onChangeRoleRouting,
}: DashboardProps) {
  void setDynamicModels
  void getToken

  function getRoleModelOptions(providerId: string): ModelOption[] {
    const dynamicProviderModels = dynamicModels[providerId]
    if (dynamicProviderModels && dynamicProviderModels.length > 0)
      return dynamicProviderModels

    return (modelsByProvider[providerId] || []).map((modelId) => ({
      id: modelId,
      name: modelId,
      displayName: modelId,
      provider: providerId,
      capabilities: modelId.toLowerCase().includes('vision') ? ['Vision'] : ['Text'],
    }))
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">AI Configuration</h1>
        <p className="text-sm text-night-400 mt-1">Choose which AI model handles each task</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ROLES.map((role) => {
            const meta = ROLE_META[role]
            const routing = roleRouting[role]
            const modelOptions = getRoleModelOptions(routing.providerId)

            return (
              <section key={role} className={`rounded-2xl border p-5 ${meta.cardClass}`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconClass}`}>
                    {meta.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-md border border-teal-500/40 bg-teal-500/10 text-teal-300 font-semibold uppercase tracking-wide">Active</span>
                    <div className="text-[11px] text-teal-300 mt-1">● 364ms</div>
                  </div>
                </div>

                <p className="text-2xl font-semibold text-white mb-1">{meta.label}</p>
                <p className="text-sm text-night-300 mb-5">{meta.description}</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium tracking-widest uppercase text-night-400 mb-1.5">Provider</label>
                    <select
                      className="w-full rounded-2xl border border-cyan-500/35 bg-slate-800/90 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                      value={routing.providerId}
                      onChange={(event) =>
                        onChangeRoleRouting(role, { providerId: event.target.value, modelId: '' })
                      }
                      aria-label={`${meta.label} provider`}
                    >
                      {providerOptions.length === 0 ? (
                        <option value="">No providers configured</option>
                      ) : (
                        providerOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {formatProviderLabel(p.label || p.id)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium tracking-widest uppercase text-night-400 mb-1.5">Model</label>
                    <ModelSelector
                      value={routing.modelId}
                      onChange={(modelId) => onChangeRoleRouting(role, { modelId })}
                      models={modelOptions}
                      placeholder="Select model..."
                      sortMode="cheapest"
                      className="w-full"
                    />
                  </div>
                </div>
              </section>
            )
          })}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-night-900 bg-white hover:bg-night-100 transition-colors"
          onClick={onConfigure}
          title="Open configuration wizard"
        >
          <Settings className="w-4 h-4" />
          Configure Providers
        </button>
        <p className="text-xs text-night-400">{configuredCount} provider currently configured</p>
      </div>
    </div>
  )
}

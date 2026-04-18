import { useCallback, useState } from 'react'
import { notifications } from '@mantine/notifications'

type ImprovementMode = 'expand' | 'reframe' | 'intensify'

export type UsePromptImprovementReturn = {
  isImproving: boolean
  improvementDiff: { originalPrompt: string; improvedPrompt: string } | null
  lastUsedModelId: string | null
  viewTab: 'final' | 'diff'
  setViewTab: (tab: 'final' | 'diff') => void
  clearDiff: () => void
  handleImprove: (currentPrompt: string, mode?: ImprovementMode) => Promise<string | null>
  handleImproveWithMeta: (currentPrompt: string, mode?: ImprovementMode) => Promise<{ prompt: string; modelId: string | null } | null>
  setImprovementDiff: (diff: { originalPrompt: string; improvedPrompt: string } | null) => void
}

export function usePromptImprovement(): UsePromptImprovementReturn {
  const [isImproving, setIsImproving] = useState(false)
  const [improvementDiff, setImprovementDiff] = useState<{ originalPrompt: string; improvedPrompt: string } | null>(null)
  const [lastUsedModelId, setLastUsedModelId] = useState<string | null>(null)
  const [viewTab, setViewTab] = useState<'final' | 'diff'>('final')

  const clearDiff = useCallback(() => {
    setImprovementDiff(null)
    setViewTab('final')
  }, [])

  const handleImproveWithMeta = useCallback(async (currentPrompt: string, mode: ImprovementMode = 'expand') => {
    const prompt = currentPrompt.trim()
    if (!prompt) return null

    setIsImproving(true)

    try {
      const result = await window.electronAPI.generator.improvePrompt({ prompt, mode })

      if (result.error || !result.data?.prompt) {
        notifications.show({
          message: result.error || 'Failed to improve prompt.',
          color: 'red',
        })
        return null
      }

      const improvedPrompt = result.data.prompt
      setLastUsedModelId(result.data.modelId || null)
      setImprovementDiff({ originalPrompt: currentPrompt, improvedPrompt })
      setViewTab('diff')
      return { prompt: improvedPrompt, modelId: result.data.modelId || null }
    } catch (error) {
      notifications.show({
        message: `Failed to improve prompt: ${String(error)}`,
        color: 'red',
      })
      return null
    } finally {
      setIsImproving(false)
    }
  }, [])

  const handleImprove = useCallback(async (currentPrompt: string, mode: ImprovementMode = 'expand') => {
    const result = await handleImproveWithMeta(currentPrompt, mode)
    return result?.prompt || null
  }, [handleImproveWithMeta])

  return {
    isImproving,
    improvementDiff,
    lastUsedModelId,
    viewTab,
    setViewTab,
    clearDiff,
    handleImprove,
    handleImproveWithMeta,
    setImprovementDiff,
  }
}

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

export type UsePromptImprovementReturn = {
  isImproving: boolean
  improvementDiff: { originalPrompt: string; improvedPrompt: string } | null
  viewTab: 'final' | 'diff'
  setViewTab: (tab: 'final' | 'diff') => void
  clearDiff: () => void
  handleImprove: (currentPrompt: string) => Promise<string | null>
  setImprovementDiff: (diff: { originalPrompt: string; improvedPrompt: string } | null) => void
}

export function usePromptImprovement(): UsePromptImprovementReturn {
  const [isImproving, setIsImproving] = useState(false)
  const [improvementDiff, setImprovementDiff] = useState<{ originalPrompt: string; improvedPrompt: string } | null>(null)
  const [viewTab, setViewTab] = useState<'final' | 'diff'>('final')

  const clearDiff = useCallback(() => {
    setImprovementDiff(null)
    setViewTab('final')
  }, [])

  const handleImprove = useCallback(async (currentPrompt: string) => {
    const prompt = currentPrompt.trim()
    if (!prompt) return null

    setIsImproving(true)

    try {
      const result = await window.electronAPI.generator.improvePrompt({ prompt })

      if (result.error || !result.data?.prompt) {
        toast.error(result.error || 'Failed to improve prompt.')
        return null
      }

      const improvedPrompt = result.data.prompt
      setImprovementDiff({ originalPrompt: currentPrompt, improvedPrompt })
      setViewTab('diff')
      return improvedPrompt
    } catch (error) {
      toast.error(`Failed to improve prompt: ${String(error)}`)
      return null
    } finally {
      setIsImproving(false)
    }
  }, [])

  return {
    isImproving,
    improvementDiff,
    viewTab,
    setViewTab,
    clearDiff,
    handleImprove,
    setImprovementDiff,
  }
}

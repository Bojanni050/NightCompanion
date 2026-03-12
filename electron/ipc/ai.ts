import { ipcMain } from 'electron'
import type { OpenRouterSettings } from './settings'

export function registerAiIpc({
  getOpenRouterSettings,
}: {
  getOpenRouterSettings: () => Promise<OpenRouterSettings>
}) {
  ipcMain.handle('generator:magicRandom', async (_, input?: { theme?: string; presetName?: string; greylistEnabled?: boolean; greylistWords?: string[] }) => {
    try {
      const settings = await getOpenRouterSettings()
      if (!settings.apiKey) {
        return { error: 'OpenRouter API key is missing. Add it in Settings first.' }
      }

      const theme = input?.theme?.trim()
      const presetName = input?.presetName?.trim()
      const greylistEnabled = input?.greylistEnabled !== false
      const greylistWords = (input?.greylistWords ?? [])
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 0)
      const uniqueGreylistWords = Array.from(new Set(greylistWords)).slice(0, 30)
      const hasGreylist = greylistEnabled && uniqueGreylistWords.length > 0

      const promptParts = [
        'Create one random, vivid text-to-image prompt.',
        presetName ? `Use this NightCafe preset as style guidance: ${presetName}.` : '',
        theme ? `Theme to include: ${theme}.` : 'Pick any surprising subject.',
        hasGreylist
          ? `Avoid these words when writing the prompt (or keep their probability very low): ${uniqueGreylistWords.join(', ')}.`
          : '',
        'Return only the final prompt text.',
      ].filter(Boolean)

      const userPrompt = promptParts.join(' ')

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
          ...(settings.siteUrl ? { 'HTTP-Referer': settings.siteUrl } : {}),
          ...(settings.appName ? { 'X-Title': settings.appName } : {}),
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: 1.2,
          max_tokens: 220,
          messages: [
            {
              role: 'system',
              content:
                'You generate exactly one high-quality text-to-image prompt. Return only the final prompt text with no numbering, no quotes, and no explanation.',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenRouter request failed (${response.status}): ${errText.slice(0, 300)}`)
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const prompt = payload.choices?.[0]?.message?.content?.trim()
      if (!prompt) {
        throw new Error('No prompt content returned from OpenRouter.')
      }

      return { data: { prompt } }
    } catch (error) {
      return { error: String(error) }
    }
  })
}

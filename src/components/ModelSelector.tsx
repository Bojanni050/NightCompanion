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
}

export default function ModelSelector({ value, onChange, models, placeholder, className }: ModelSelectorProps) {
  void placeholder

  return (
    <select
      className={`input ${className || ''}`.trim()}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Model selector"
      title="Model selector"
    >
      {models.map((model) => {
        const label = model.label || model.name || model.id
        return (
          <option key={model.id} value={model.id}>
            {label}
          </option>
        )
      })}
    </select>
  )
}

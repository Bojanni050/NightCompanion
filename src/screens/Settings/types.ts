export interface ApiKeyInfo {
  id: string
  provider: string
  apiKeyMasked: string
  model: string
  is_active_gen: boolean
  is_active_improve: boolean
  is_active_vision: boolean
}

export interface LocalEndpoint {
  id: string
  name: string
  baseUrl: string
  model: string
  is_active_gen: boolean
  is_active_improve: boolean
  is_active_vision: boolean
  updated_at: string
}

export interface ModelOption {
  id: string
  label: string
}

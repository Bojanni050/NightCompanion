export type CharacterImage = {
  id: string
  url: string
  isMain: boolean
  createdAt: string
}

export type CharacterDetail = {
  id: string
  detail: string
  category: string
  worksWell: boolean
}

export type CharacterRecord = {
  id: string
  name: string
  description: string
  images: CharacterImage[]
  details: CharacterDetail[]
  createdAt: string
  updatedAt: string
}

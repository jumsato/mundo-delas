export type Person = 'juliana' | 'isa'
export type WishlistOwner = Person | 'shared'
export type Level = 'country' | 'state' | 'city'

export interface VisitEntry {
  level: Level
  id: string
  name: string
  juliana: boolean
  isa: boolean
}

// keyed by `${level}:${id}`
export type VisitRecord = Record<string, VisitEntry>

export interface WishlistEntry {
  level: Level
  id: string
  name: string
  rank: number
}

// keyed by `${level}:${id}`
export type WishlistRecord = Record<string, WishlistEntry>
export type WishlistsByOwner = Record<WishlistOwner, WishlistRecord>

export interface StateFeatureProps {
  id: string
  name: string
}

export interface CityEntry {
  id: string
  name: string
  lat: number
  lon: number
  pop: number
  stateId: string | null
}

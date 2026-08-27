export type VisitStatus = 'visited' | 'wishlist'

export interface CountryEntry {
  id: string
  name: string
  status: VisitStatus
  rank?: number
}

export type CountryRecord = Record<string, CountryEntry>

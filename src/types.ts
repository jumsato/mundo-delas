export type Person = 'juliana' | 'isa'
export type WishlistOwner = Person | 'shared'

export interface VisitEntry {
  countryId: string
  countryName: string
  juliana: boolean
  isa: boolean
}

export type VisitRecord = Record<string, VisitEntry>

export interface WishlistEntry {
  countryId: string
  countryName: string
  rank: number
}

export type WishlistRecord = Record<string, WishlistEntry>
export type WishlistsByOwner = Record<WishlistOwner, WishlistRecord>

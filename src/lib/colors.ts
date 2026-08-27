import type { Person, WishlistOwner } from '../types'

export const COLOR_NONE = '#c9cedd'
export const COLOR_TOGETHER = '#e64980'
export const MAP_STROKE = '#ffffff'

// Each person gets her own color family: a solid tone for "visited" and a
// pale tone of the same hue for "want to visit". The shared wishlist (want
// to go together) gets its own distinct color so it never gets confused
// with either person's individual list.
export const PERSON_COLOR: Record<Person, string> = {
  juliana: '#1f9d55',
  isa: '#8b3fd1',
}

export const PERSON_WISHLIST_COLOR: Record<Person, string> = {
  juliana: '#b7ecc7',
  isa: '#ddc6f5',
}

export const SHARED_WISHLIST_COLOR = '#f2b545'

export function wishlistColor(owner: WishlistOwner): string {
  return owner === 'shared' ? SHARED_WISHLIST_COLOR : PERSON_WISHLIST_COLOR[owner]
}

interface VisitedFlags {
  juliana?: boolean
  isa?: boolean
}

interface WishlistFlags {
  mine: boolean
  shared: boolean
  other: boolean
}

// Priority: visited together > visited by me > visited by her > shared wishlist
// > my wishlist > her wishlist > untouched.
export function statusFill(visited: VisitedFlags | undefined, wishlisted: WishlistFlags, person: Person): string {
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'
  if (visited?.juliana && visited?.isa) return COLOR_TOGETHER
  if (visited?.[person]) return PERSON_COLOR[person]
  if (visited?.[other]) return PERSON_COLOR[other]
  if (wishlisted.shared) return SHARED_WISHLIST_COLOR
  if (wishlisted.mine) return PERSON_WISHLIST_COLOR[person]
  if (wishlisted.other) return PERSON_WISHLIST_COLOR[other]
  return COLOR_NONE
}

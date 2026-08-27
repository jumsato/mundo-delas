import { useCallback, useEffect, useState } from 'react'
import type { CountryRecord, VisitStatus } from '../types'

const STORAGE_KEY = 'mundo-delas:countries:v1'

function loadInitial(): CountryRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CountryRecord) : {}
  } catch {
    return {}
  }
}

export function useCountryData() {
  const [records, setRecords] = useState<CountryRecord>(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch {
      // storage unavailable (private mode, quota) - data just won't persist
    }
  }, [records])

  const nextWishlistRank = useCallback(
    (current: CountryRecord) =>
      1 +
      Object.values(current).reduce(
        (max, entry) => (entry.status === 'wishlist' && entry.rank ? Math.max(max, entry.rank) : max),
        0,
      ),
    [],
  )

  const markVisited = useCallback((id: string, name: string) => {
    setRecords((prev) => ({ ...prev, [id]: { id, name, status: 'visited' as VisitStatus } }))
  }, [])

  const markWishlist = useCallback(
    (id: string, name: string) => {
      setRecords((prev) => {
        if (prev[id]?.status === 'wishlist') return prev
        return { ...prev, [id]: { id, name, status: 'wishlist', rank: nextWishlistRank(prev) } }
      })
    },
    [nextWishlistRank],
  )

  const clearCountry = useCallback((id: string) => {
    setRecords((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const reorderWishlist = useCallback((orderedIds: string[]) => {
    setRecords((prev) => {
      const next = { ...prev }
      orderedIds.forEach((id, index) => {
        const entry = next[id]
        if (entry) next[id] = { ...entry, rank: index + 1 }
      })
      return next
    })
  }, [])

  return { records, markVisited, markWishlist, clearCountry, reorderWishlist }
}

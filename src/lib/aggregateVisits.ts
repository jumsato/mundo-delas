import type { VisitRecord } from '../types'

export interface AggStatus {
  juliana: boolean
  isa: boolean
}

// Groups visited (juliana/isa true) entries by an ancestor key so a mark made
// on a city or state can also light up its state/country on the wider maps.
export function aggregateVisits(
  visits: VisitRecord,
  keyOf: (entry: VisitRecord[string]) => string | undefined,
): Map<string, AggStatus> {
  const map = new Map<string, AggStatus>()
  for (const entry of Object.values(visits)) {
    if (!entry.juliana && !entry.isa) continue
    const key = keyOf(entry)
    if (!key) continue
    const current = map.get(key) ?? { juliana: false, isa: false }
    current.juliana = current.juliana || entry.juliana
    current.isa = current.isa || entry.isa
    map.set(key, current)
  }
  return map
}

import { useMemo } from 'react'
import type { Level, Person, VisitRecord } from '../types'
import { aggregateVisits } from '../lib/aggregateVisits'
import { regionForCountry } from '../lib/countryRegion'
import { PERSON_COLOR, COLOR_TOGETHER } from '../lib/colors'
import countryNames from '../data/country-names.json'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }
const LEVEL_LABEL: Record<Level, string> = { country: 'países', state: 'estados', city: 'cidades' }
const TOTAL_CONTINENTS = new Set(
  countryNames.map((c) => regionForCountry(c.id)?.region).filter((r): r is string => Boolean(r)),
).size

interface StatsPanelProps {
  person: Person
  visits: VisitRecord
  onClose: () => void
}

function byLevelCounts(places: VisitRecord[string][]): Record<Level, number> {
  return {
    country: places.filter((p) => p.level === 'country').length,
    state: places.filter((p) => p.level === 'state').length,
    city: places.filter((p) => p.level === 'city').length,
  }
}

export function StatsPanel({ person, visits, onClose }: StatsPanelProps) {
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  const { placesByPerson, togetherPlaces, continentsByPerson } = useMemo(() => {
    const all = Object.values(visits)
    const placesByPerson: Record<Person, VisitRecord[string][]> = {
      juliana: all.filter((v) => v.juliana),
      isa: all.filter((v) => v.isa),
    }
    const togetherPlaces = all.filter((v) => v.juliana && v.isa).length

    // Continents only make sense at country granularity, so bubble city/state
    // marks up to their country first.
    const countryStatus = aggregateVisits(visits, (v) => (v.level === 'country' ? v.id : v.countryId))
    const continentsByPerson: Record<Person, number> = { juliana: 0, isa: 0 }
    for (const person of ['juliana', 'isa'] as Person[]) {
      const regions = new Set<string>()
      for (const [id, status] of countryStatus.entries()) {
        if (status[person]) {
          const region = regionForCountry(id)?.region
          if (region) regions.add(region)
        }
      }
      continentsByPerson[person] = regions.size
    }

    return { placesByPerson, togetherPlaces, continentsByPerson }
  }, [visits])

  const myCounts = byLevelCounts(placesByPerson[person])
  const otherCounts = byLevelCounts(placesByPerson[other])

  const leader: Person | 'empate' =
    placesByPerson[person].length === placesByPerson[other].length
      ? 'empate'
      : placesByPerson[person].length > placesByPerson[other].length
        ? person
        : other

  function breakdownText(counts: Record<Level, number>) {
    return (['country', 'state', 'city'] as Level[])
      .filter((level) => counts[level] > 0)
      .map((level) => `${counts[level]} ${LEVEL_LABEL[level]}`)
      .join(' · ') || 'nenhum lugar ainda'
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card stats-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2>Estatísticas</h2>

        <div className="stats-row">
          <div className="stats-person">
            <span className="stats-person-name" style={{ color: PERSON_COLOR[person] }}>
              {PERSON_LABEL[person]}
            </span>
            <span className="stats-value">{placesByPerson[person].length}</span>
            <span className="stats-sub">lugares · {breakdownText(myCounts)}</span>
            <span className="stats-sub">{continentsByPerson[person]}/{TOTAL_CONTINENTS} continentes</span>
          </div>
          <div className="stats-person">
            <span className="stats-person-name" style={{ color: PERSON_COLOR[other] }}>
              {PERSON_LABEL[other]}
            </span>
            <span className="stats-value">{placesByPerson[other].length}</span>
            <span className="stats-sub">lugares · {breakdownText(otherCounts)}</span>
            <span className="stats-sub">{continentsByPerson[other]}/{TOTAL_CONTINENTS} continentes</span>
          </div>
        </div>

        <div className="stats-together" style={{ borderColor: COLOR_TOGETHER }}>
          <strong style={{ color: COLOR_TOGETHER }}>{togetherPlaces}</strong> lugares visitados juntas
        </div>

        <p className="stats-leader">
          {leader === 'empate'
            ? 'Vocês estão empatadas — corre pro próximo lugar! 🏁'
            : `${PERSON_LABEL[leader]} está na frente por enquanto 🏆`}
        </p>
      </div>
    </div>
  )
}

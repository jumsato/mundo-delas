import { useMemo } from 'react'
import type { Person, VisitRecord } from '../types'
import { aggregateVisits } from '../lib/aggregateVisits'
import { regionForCountry } from '../lib/countryRegion'
import { PERSON_COLOR, COLOR_TOGETHER } from '../lib/colors'
import countryNames from '../data/country-names.json'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }
const TOTAL_COUNTRIES = countryNames.length

const ALL_REGIONS = new Set(
  countryNames.map((c) => regionForCountry(c.id)?.region).filter((r): r is string => Boolean(r)),
)
const TOTAL_CONTINENTS = ALL_REGIONS.size

interface StatsPanelProps {
  person: Person
  visits: VisitRecord
  onClose: () => void
}

function regionsVisitedBy(countryIds: string[]): Set<string> {
  const regions = new Set<string>()
  for (const id of countryIds) {
    const region = regionForCountry(id)?.region
    if (region) regions.add(region)
  }
  return regions
}

export function StatsPanel({ person, visits, onClose }: StatsPanelProps) {
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  const { julianaIds, isaIds, togetherCount } = useMemo(() => {
    const countryStatus = aggregateVisits(visits, (v) => (v.level === 'country' ? v.id : v.countryId))
    const julianaIds: string[] = []
    const isaIds: string[] = []
    let togetherCount = 0
    for (const [id, status] of countryStatus.entries()) {
      if (status.juliana) julianaIds.push(id)
      if (status.isa) isaIds.push(id)
      if (status.juliana && status.isa) togetherCount += 1
    }
    return { julianaIds, isaIds, togetherCount }
  }, [visits])

  const byPerson: Record<Person, string[]> = { juliana: julianaIds, isa: isaIds }
  const myPct = Math.round((byPerson[person].length / TOTAL_COUNTRIES) * 100)
  const otherPct = Math.round((byPerson[other].length / TOTAL_COUNTRIES) * 100)
  const myContinents = regionsVisitedBy(byPerson[person]).size
  const otherContinents = regionsVisitedBy(byPerson[other]).size

  const leader: Person | 'empate' =
    byPerson[person].length === byPerson[other].length ? 'empate' : byPerson[person].length > byPerson[other].length ? person : other

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
            <span className="stats-value">{byPerson[person].length}</span>
            <span className="stats-sub">
              {myPct}% do mundo · {myContinents}/{TOTAL_CONTINENTS} continentes
            </span>
          </div>
          <div className="stats-person">
            <span className="stats-person-name" style={{ color: PERSON_COLOR[other] }}>
              {PERSON_LABEL[other]}
            </span>
            <span className="stats-value">{byPerson[other].length}</span>
            <span className="stats-sub">
              {otherPct}% do mundo · {otherContinents}/{TOTAL_CONTINENTS} continentes
            </span>
          </div>
        </div>

        <div className="stats-together" style={{ borderColor: COLOR_TOGETHER }}>
          <strong style={{ color: COLOR_TOGETHER }}>{togetherCount}</strong> países visitados juntas
        </div>

        <p className="stats-leader">
          {leader === 'empate'
            ? 'Vocês estão empatadas — corre pro próximo país! 🏁'
            : `${PERSON_LABEL[leader]} está na frente por enquanto 🏆`}
        </p>
      </div>
    </div>
  )
}

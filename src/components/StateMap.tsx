import { useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { ProjectionFunction } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import type { Feature, FeatureCollection } from 'geojson'
import type { Person, VisitRecord, WishlistsByOwner } from '../types'
import { fitProjection, MAP_HEIGHT, MAP_WIDTH } from '../lib/fitProjection'
import { MAP_STROKE, statusFill } from '../lib/colors'
import { aggregateVisits } from '../lib/aggregateVisits'
import { MapAvatar } from './MapAvatar'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'

const AVATAR_SIZE = 12
const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }

interface StateFeature extends Feature {
  properties: { id: string; name: string }
}

interface StateMapProps {
  countryId: string
  person: Person
  visits: VisitRecord
  wishlists: WishlistsByOwner
  onStateChosen: (feature: StateFeature) => void
}

export function StateMap({ countryId, person, visits, wishlists, onStateChosen }: StateMapProps) {
  const [data, setData] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState(false)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(false)
    fetch(`${import.meta.env.BASE_URL}data/states/${countryId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
  }, [countryId])

  const projection = useMemo(() => (data ? fitProjection(data) : null), [data])

  // A mark made on a city bubbles up here so the whole state lights up too.
  const stateStatus = useMemo(
    () => aggregateVisits(visits, (v) => (v.level === 'state' ? v.id : v.level === 'city' ? v.stateId : undefined)),
    [visits],
  )

  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  function fillFor(id: string) {
    const key = `state:${id}`
    return statusFill(
      stateStatus.get(id),
      { mine: Boolean(wishlists[person][key]), shared: Boolean(wishlists.shared[key]), other: Boolean(wishlists[other][key]) },
      person,
    )
  }

  if (error) {
    return <p className="map-inline-message">Não temos dados de estados/províncias para este país ainda.</p>
  }

  if (!data || !projection) {
    return <p className="map-inline-message">Carregando estados…</p>
  }

  return (
    <div className="map-wrap">
      <div className="map-toolbar">
        <span className="map-hint">{hoveredName ?? 'Clique em um estado/província'}</span>
      </div>
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projection={projection as unknown as ProjectionFunction}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={data}>
          {({ geographies }) => {
            const centroidById = new Map<string, [number, number]>()
            for (const geo of geographies) {
              centroidById.set(geo.properties.id, geoCentroid(geo as never) as [number, number])
            }
            return (
              <>
                {geographies.map((geo) => (
                  <Geography
                    key={geo.properties.id}
                    geography={geo}
                    onClick={() => onStateChosen(geo as StateFeature)}
                    onMouseEnter={() => setHoveredName(geo.properties.name)}
                    onMouseLeave={() => setHoveredName(null)}
                    style={{
                      default: {
                        fill: fillFor(geo.properties.id),
                        stroke: MAP_STROKE,
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                      hover: {
                        fill: fillFor(geo.properties.id),
                        opacity: 0.8,
                        stroke: MAP_STROKE,
                        strokeWidth: 0.8,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { fill: '#6c74a0', outline: 'none' },
                    }}
                  />
                ))}
                {[...stateStatus.entries()].map(([id, status]) => {
                  const coords = centroidById.get(id)
                  if (!coords) return null
                  const src = status.juliana && status.isa ? togetherAvatar : PERSON_AVATAR[status.juliana ? 'juliana' : 'isa']
                  return <MapAvatar key={id} id={`state-${id}`} coordinates={coords} src={src} size={AVATAR_SIZE} />
                })}
              </>
            )
          }}
        </Geographies>
      </ComposableMap>
    </div>
  )
}

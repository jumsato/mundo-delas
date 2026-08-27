import { useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { ProjectionFunction } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import type { Feature, FeatureCollection } from 'geojson'
import type { Person, VisitRecord, WishlistsByOwner } from '../types'
import { fitProjection, MAP_HEIGHT, MAP_WIDTH } from '../lib/fitProjection'
import { COLOR_NONE, COLOR_TOGETHER, COLOR_WISHLIST, MAP_STROKE, PERSON_COLOR } from '../lib/colors'
import { MapAvatar } from './MapAvatar'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'

const AVATAR_SIZE = 10
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

  const stateVisits = useMemo(
    () => Object.values(visits).filter((v) => v.level === 'state' && (v.juliana || v.isa)),
    [visits],
  )

  function statusFill(id: string) {
    const key = `state:${id}`
    const visit = visits[key]
    if (visit?.juliana && visit?.isa) return COLOR_TOGETHER
    if (visit?.[person]) return PERSON_COLOR[person]
    const other: Person = person === 'juliana' ? 'isa' : 'juliana'
    if (visit?.[other]) return PERSON_COLOR[other]
    if (wishlists[person][key] || wishlists.shared[key]) return COLOR_WISHLIST
    return COLOR_NONE
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
                        fill: statusFill(geo.properties.id),
                        stroke: MAP_STROKE,
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                      hover: {
                        fill: statusFill(geo.properties.id),
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
                {stateVisits.map((v) => {
                  const coords = centroidById.get(v.id)
                  if (!coords) return null
                  const src = v.juliana && v.isa ? togetherAvatar : PERSON_AVATAR[v.juliana ? 'juliana' : 'isa']
                  return <MapAvatar key={v.id} id={`state-${v.id}`} coordinates={coords} src={src} size={AVATAR_SIZE} />
                })}
              </>
            )
          }}
        </Geographies>
      </ComposableMap>
    </div>
  )
}

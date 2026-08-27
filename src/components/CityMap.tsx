import { useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geography, Marker } from 'react-simple-maps'
import type { ProjectionFunction } from 'react-simple-maps'
import type { Feature } from 'geojson'
import type { CityEntry, Person, VisitRecord, WishlistsByOwner } from '../types'
import { fitProjection, MAP_HEIGHT, MAP_WIDTH } from '../lib/fitProjection'
import { COLOR_NONE, COLOR_TOGETHER, COLOR_WISHLIST, MAP_STROKE, PERSON_COLOR } from '../lib/colors'
import { MapAvatar } from './MapAvatar'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'

const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }

interface CityMapProps {
  countryId: string
  stateId: string
  stateFeature: Feature
  person: Person
  visits: VisitRecord
  wishlists: WishlistsByOwner
  onCityChosen: (city: CityEntry) => void
}

export function CityMap({ countryId, stateId, stateFeature, person, visits, wishlists, onCityChosen }: CityMapProps) {
  const [allCities, setAllCities] = useState<CityEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  useEffect(() => {
    setAllCities(null)
    setError(false)
    fetch(`${import.meta.env.BASE_URL}data/cities/${countryId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(setAllCities)
      .catch(() => setError(true))
  }, [countryId])

  const cities = useMemo(
    () => (allCities ? allCities.filter((c) => c.stateId === stateId) : []),
    [allCities, stateId],
  )

  const projection = useMemo(() => fitProjection({ type: 'FeatureCollection', features: [stateFeature] }), [stateFeature])

  function statusFill(cityId: string) {
    const key = `city:${cityId}`
    const visit = visits[key]
    if (visit?.juliana && visit?.isa) return COLOR_TOGETHER
    if (visit?.[person]) return PERSON_COLOR[person]
    const other: Person = person === 'juliana' ? 'isa' : 'juliana'
    if (visit?.[other]) return PERSON_COLOR[other]
    if (wishlists[person][key] || wishlists.shared[key]) return COLOR_WISHLIST
    return '#9098ac'
  }

  if (error) {
    return <p className="map-inline-message">Não temos dados de cidades para este país ainda.</p>
  }

  if (!allCities) {
    return <p className="map-inline-message">Carregando cidades…</p>
  }

  if (cities.length === 0) {
    return <p className="map-inline-message">Não temos cidades cadastradas para este estado ainda.</p>
  }

  return (
    <div className="map-wrap">
      <div className="map-toolbar">
        <span className="map-hint">{hoveredName ?? 'Clique em uma cidade'}</span>
      </div>
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projection={projection as unknown as ProjectionFunction}
        style={{ width: '100%', height: '100%' }}
      >
        <Geography
          geography={stateFeature}
          style={{
            default: { fill: COLOR_NONE, stroke: MAP_STROKE, strokeWidth: 0.6, outline: 'none' },
            hover: { fill: COLOR_NONE, stroke: MAP_STROKE, strokeWidth: 0.6, outline: 'none' },
            pressed: { fill: COLOR_NONE, outline: 'none' },
          }}
        />
        {cities.map((city) => {
          const visit = visits[`city:${city.id}`]
          const visited = visit?.juliana || visit?.isa
          if (visited) {
            const src = visit?.juliana && visit?.isa ? togetherAvatar : PERSON_AVATAR[visit?.juliana ? 'juliana' : 'isa']
            return (
              <MapAvatar
                key={city.id}
                id={`city-${city.id}`}
                coordinates={[city.lon, city.lat]}
                src={src}
                size={9}
                onClick={() => onCityChosen(city)}
                onMouseEnter={() => setHoveredName(city.name)}
                onMouseLeave={() => setHoveredName(null)}
              />
            )
          }
          return (
            <Marker
              key={city.id}
              coordinates={[city.lon, city.lat]}
              onClick={() => onCityChosen(city)}
              onMouseEnter={() => setHoveredName(city.name)}
              onMouseLeave={() => setHoveredName(null)}
              style={{ default: { cursor: 'pointer' } }}
            >
              <circle r={5} fill={statusFill(city.id)} stroke="#ffffff" strokeWidth={1.5} />
            </Marker>
          )
        })}
      </ComposableMap>
    </div>
  )
}

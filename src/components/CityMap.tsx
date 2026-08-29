import { useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import type { ProjectionFunction } from 'react-simple-maps'
import type { Feature } from 'geojson'
import type { CityEntry, Level, Person, VisitRecord, WishlistsByOwner } from '../types'
import { fitProjection, MAP_HEIGHT, MAP_WIDTH } from '../lib/fitProjection'
import { COLOR_NONE, MAP_STROKE, statusFill } from '../lib/colors'
import { MapAvatar } from './MapAvatar'
import { CountryInfoTrigger } from './CountryInfoTrigger'
import { CountryInfoModal } from './CountryInfoModal'
import { InfoBadgeMarker } from './InfoBadgeMarker'
import { MemoriesModal } from './MemoriesModal'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'

const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }

interface CityMapProps {
  countryId: string
  countryName: string
  stateId: string
  stateFeature: Feature
  person: Person
  visits: VisitRecord
  wishlists: WishlistsByOwner
  onCityChosen: (city: CityEntry) => void
  onUpdateMeta: (level: Level, id: string, patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (level: Level, id: string, dataUrl: string) => void
  onRemovePhoto: (level: Level, id: string, dataUrl: string) => void
}

export function CityMap({
  countryId,
  countryName,
  stateId,
  stateFeature,
  person,
  visits,
  wishlists,
  onCityChosen,
  onUpdateMeta,
  onAddPhoto,
  onRemovePhoto,
}: CityMapProps) {
  const [allCities, setAllCities] = useState<CityEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [memoriesForId, setMemoriesForId] = useState<string | null>(null)
  const [infoForId, setInfoForId] = useState<string | null>(null)

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

  const stateFC = useMemo(() => ({ type: 'FeatureCollection' as const, features: [stateFeature] }), [stateFeature])
  const projection = useMemo(() => fitProjection(stateFC), [stateFC])

  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  function fillFor(cityId: string) {
    const key = `city:${cityId}`
    return statusFill(
      visits[key],
      { mine: Boolean(wishlists[person][key]), shared: Boolean(wishlists.shared[key]), other: Boolean(wishlists[other][key]) },
      person,
    )
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
      <div className="map-fab-stack">
        <CountryInfoTrigger countryId={countryId} countryName={countryName} />
      </div>
      <div className="map-toolbar">
        <span className="map-hint">{hoveredName ?? 'Clique em uma cidade'}</span>
      </div>
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projection={projection as unknown as ProjectionFunction}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={stateFC}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: COLOR_NONE, stroke: MAP_STROKE, strokeWidth: 0.6, outline: 'none' },
                  hover: { fill: COLOR_NONE, stroke: MAP_STROKE, strokeWidth: 0.6, outline: 'none' },
                  pressed: { fill: COLOR_NONE, outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {cities.map((city) => {
          const visit = visits[`city:${city.id}`]
          const visited = visit?.juliana || visit?.isa
          if (visited) {
            const src = visit?.juliana && visit?.isa ? togetherAvatar : PERSON_AVATAR[visit?.juliana ? 'juliana' : 'isa']
            const mine = Boolean(visit?.[person])
            return (
              <MapAvatar
                key={city.id}
                id={`city-${city.id}`}
                coordinates={[city.lon, city.lat]}
                src={src}
                size={12}
                onClick={() => onCityChosen(city)}
                onMouseEnter={() => setHoveredName(city.name)}
                onMouseLeave={() => setHoveredName(null)}
                badges={[
                  { emoji: '💡', title: `Curiosidades sobre ${city.name}`, onClick: () => setInfoForId(city.id) },
                  ...(mine ? [{ emoji: '📷', title: 'Lembranças', onClick: () => setMemoriesForId(city.id) }] : []),
                ]}
              />
            )
          }
          return (
            <g key={city.id}>
              <Marker
                coordinates={[city.lon, city.lat]}
                onClick={() => onCityChosen(city)}
                onMouseEnter={() => setHoveredName(city.name)}
                onMouseLeave={() => setHoveredName(null)}
                style={{ default: { cursor: 'pointer' } }}
              >
                <circle r={4} fill={fillFor(city.id)} stroke="#ffffff" strokeWidth={1} />
              </Marker>
              <InfoBadgeMarker
                coordinates={[city.lon, city.lat]}
                title={`Curiosidades sobre ${city.name}`}
                offset={[7, -7]}
                onClick={() => setInfoForId(city.id)}
              />
            </g>
          )
        })}
      </ComposableMap>
      {memoriesForId && (
        <MemoriesModal
          title={cities.find((c) => c.id === memoriesForId)?.name ?? ''}
          meta={visits[`city:${memoriesForId}`]?.meta?.[person] ?? {}}
          onUpdateMeta={(patch) => onUpdateMeta('city', memoriesForId, patch)}
          onAddPhoto={(dataUrl) => onAddPhoto('city', memoriesForId, dataUrl)}
          onRemovePhoto={(dataUrl) => onRemovePhoto('city', memoriesForId, dataUrl)}
          onClose={() => setMemoriesForId(null)}
        />
      )}
      {infoForId && (
        <CountryInfoModal
          countryId={infoForId}
          countryName={cities.find((c) => c.id === infoForId)?.name ?? ''}
          level="city"
          hint={countryName}
          onClose={() => setInfoForId(null)}
        />
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import type { Person, VisitRecord, WishlistsByOwner } from '../types'
import worldTopoJson from '../data/world-110m.json'
import { MAP_STROKE, statusFill } from '../lib/colors'
import { aggregateVisits } from '../lib/aggregateVisits'
import { MapAvatar } from './MapAvatar'
import { CountryInfoTrigger } from './CountryInfoTrigger'
import { MemoriesTrigger } from './MemoriesTrigger'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'

const MIN_ZOOM = 1
const MAX_ZOOM = 16
const ZOOM_STEP = 2.6
const MODAL_ZOOM_TRIGGER = 10
const AVATAR_BASE_SIZE = 11
// Keep in sync with the transition duration on .rsm-zoomable-group in App.css.
// While the map is still animating to its new position, the underlying SVG
// geometry has already jumped there — a click during that window would hit
// whatever is at the (still-moving) pixel today, not what the eye sees, so we
// briefly ignore clicks instead of letting them land on the wrong country.
const TRANSITION_MS = 280

const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }

interface Position {
  coordinates: [number, number]
  zoom: number
}

const DEFAULT_POSITION: Position = { coordinates: [0, 15], zoom: MIN_ZOOM }

interface WorldMapProps {
  person: Person
  visits: VisitRecord
  wishlists: WishlistsByOwner
  onCountryChosen: (id: string, name: string) => void
  onUpdateMeta: (level: 'country', id: string, patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (level: 'country', id: string, dataUrl: string) => void
  onRemovePhoto: (level: 'country', id: string, dataUrl: string) => void
}

export function WorldMap({
  person,
  visits,
  wishlists,
  onCountryChosen,
  onUpdateMeta,
  onAddPhoto,
  onRemovePhoto,
}: WorldMapProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [focusedName, setFocusedName] = useState<string | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  function animateTo(next: Position) {
    setPosition(next)
    setIsAnimating(true)
    window.setTimeout(() => setIsAnimating(false), TRANSITION_MS)
  }

  // A mark made on a state or city bubbles up here so the whole country lights up too.
  const countryStatus = useMemo(
    () => aggregateVisits(visits, (v) => (v.level === 'country' ? v.id : v.countryId)),
    [visits],
  )

  function handleCountryClick(geo: { id: string; properties: { name: string } }) {
    if (isAnimating) return
    const id = String(geo.id)
    const name = geo.properties.name

    const readyForModal = position.zoom >= MODAL_ZOOM_TRIGGER && focusedId === id
    if (readyForModal) {
      onCountryChosen(id, name)
      return
    }

    const centroid = geoCentroid(geo as never)
    const nextZoom = Math.min(position.zoom * ZOOM_STEP, MAX_ZOOM)
    setFocusedId(id)
    setFocusedName(name)
    animateTo({ coordinates: centroid as [number, number], zoom: nextZoom })
  }

  function handleReset() {
    if (isAnimating) return
    animateTo(DEFAULT_POSITION)
    setFocusedId(null)
    setFocusedName(null)
  }

  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  function fillFor(id: string) {
    const key = `country:${id}`
    return statusFill(
      countryStatus.get(id),
      { mine: Boolean(wishlists[person][key]), shared: Boolean(wishlists.shared[key]), other: Boolean(wishlists[other][key]) },
      person,
    )
  }

  const closeToModal = position.zoom >= MODAL_ZOOM_TRIGGER
  const avatarSize = AVATAR_BASE_SIZE / position.zoom
  const focusedVisited = focusedId ? Boolean(visits[`country:${focusedId}`]?.[person]) : false
  const focusedMeta = focusedId ? (visits[`country:${focusedId}`]?.meta?.[person] ?? {}) : {}

  return (
    <div className={isAnimating ? 'map-wrap map-wrap-animating' : 'map-wrap'}>
      {closeToModal && focusedId && focusedName && (
        <div className="map-fab-stack">
          <CountryInfoTrigger countryId={focusedId} countryName={focusedName} />
          {focusedVisited && (
            <MemoriesTrigger
              countryName={focusedName}
              meta={focusedMeta}
              onUpdateMeta={(patch) => onUpdateMeta('country', focusedId, patch)}
              onAddPhoto={(dataUrl) => onAddPhoto('country', focusedId, dataUrl)}
              onRemovePhoto={(dataUrl) => onRemovePhoto('country', focusedId, dataUrl)}
            />
          )}
        </div>
      )}
      <div className="map-toolbar">
        <button type="button" onClick={handleReset} disabled={position.zoom === MIN_ZOOM}>
          Ver mundo inteiro
        </button>
        <span className="map-hint">
          {hoveredName
            ? closeToModal && focusedId
              ? `Clique novamente em ${hoveredName} para marcar`
              : hoveredName
            : 'Clique em um país para ampliar'}
        </span>
      </div>
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        >
          <Geographies geography={worldTopoJson}>
            {({ geographies }) => {
              const centroidById = new Map<string, [number, number]>()
              for (const geo of geographies) {
                centroidById.set(String(geo.id), geoCentroid(geo as never) as [number, number])
              }
              return (
                <>
                  {geographies.map((geo) => {
                    const id = String(geo.id)
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={() => setHoveredName(geo.properties.name)}
                        onMouseLeave={() => setHoveredName(null)}
                        style={{
                          default: {
                            fill: fillFor(id),
                            stroke: MAP_STROKE,
                            strokeWidth: 0.4,
                            outline: 'none',
                          },
                          hover: {
                            fill: fillFor(id),
                            opacity: 0.8,
                            stroke: MAP_STROKE,
                            strokeWidth: 0.5,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: {
                            fill: '#6c74a0',
                            outline: 'none',
                          },
                        }}
                      />
                    )
                  })}
                  {[...countryStatus.entries()].map(([id, status]) => {
                    const coords = centroidById.get(id)
                    if (!coords) return null
                    const src = status.juliana && status.isa ? togetherAvatar : PERSON_AVATAR[status.juliana ? 'juliana' : 'isa']
                    return <MapAvatar key={id} id={`country-${id}`} coordinates={coords} src={src} size={avatarSize} />
                  })}
                </>
              )
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

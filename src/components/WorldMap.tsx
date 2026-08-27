import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import type { Person, VisitRecord, WishlistsByOwner } from '../types'
import worldTopoJson from '../data/world-110m.json'

const MIN_ZOOM = 1
const MAX_ZOOM = 16
const ZOOM_STEP = 2.6
const MODAL_ZOOM_TRIGGER = 10

const COLOR_NONE = '#3a3f52'
const COLOR_WISHLIST = '#e0a93c'
const COLOR_TOGETHER = '#c968e0'
const PERSON_COLOR: Record<Person, string> = {
  juliana: '#4f8fe0',
  isa: '#e0703c',
}

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
}

export function WorldMap({ person, visits, wishlists, onCountryChosen }: WorldMapProps) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  function handleCountryClick(geo: { id: string; properties: { name: string } }) {
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
    setPosition({ coordinates: centroid as [number, number], zoom: nextZoom })
  }

  function handleReset() {
    setPosition(DEFAULT_POSITION)
    setFocusedId(null)
  }

  function statusFill(id: string) {
    const visit = visits[id]
    if (visit?.juliana && visit?.isa) return COLOR_TOGETHER
    if (visit?.[person]) return PERSON_COLOR[person]
    const other: Person = person === 'juliana' ? 'isa' : 'juliana'
    if (visit?.[other]) return PERSON_COLOR[other]
    if (wishlists[person][id] || wishlists.shared[id]) return COLOR_WISHLIST
    return COLOR_NONE
  }

  const closeToModal = position.zoom >= MODAL_ZOOM_TRIGGER

  return (
    <div className="map-wrap">
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
            {({ geographies }) =>
              geographies.map((geo) => {
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
                        fill: statusFill(id),
                        stroke: '#1b1e29',
                        strokeWidth: 0.4,
                        outline: 'none',
                      },
                      hover: {
                        fill: statusFill(id),
                        opacity: 0.8,
                        stroke: '#1b1e29',
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
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

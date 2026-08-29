import { Marker } from 'react-simple-maps'

interface InfoBadgeMarkerProps {
  coordinates: [number, number]
  title?: string
  size?: number
  // pixel offset from the marker's projected position, so it can sit beside
  // another marker (e.g. a city dot) placed at the same coordinates.
  offset?: [number, number]
  onClick: () => void
}

export function InfoBadgeMarker({ coordinates, title, size = 5, offset = [0, 0], onClick }: InfoBadgeMarkerProps) {
  return (
    <Marker coordinates={coordinates} style={{ default: { pointerEvents: 'none' } }}>
      <g
        transform={`translate(${offset[0]}, ${offset[1]})`}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      >
        <circle r={size} fill="#ffffff" stroke="rgba(20,22,30,0.25)" strokeWidth={0.5} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={size * 1.3}>
          {title ? <title>{title}</title> : null}
          💡
        </text>
      </g>
    </Marker>
  )
}

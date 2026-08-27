import { Marker } from 'react-simple-maps'

interface MapAvatarProps {
  id: string
  coordinates: [number, number]
  src: string
  size?: number
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MapAvatar({ id, coordinates, src, size = 9, onClick, onMouseEnter, onMouseLeave }: MapAvatarProps) {
  const clipId = `avatar-clip-${id}`
  const interactive = Boolean(onClick)
  return (
    <Marker
      coordinates={coordinates}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ default: { pointerEvents: interactive ? 'auto' : 'none', cursor: interactive ? 'pointer' : 'default' } }}
    >
      <clipPath id={clipId}>
        <circle r={size} />
      </clipPath>
      <circle r={size + 1.5} fill="#ffffff" stroke="rgba(20,22,30,0.25)" strokeWidth={0.6} />
      <image
        href={src}
        x={-size}
        y={-size}
        width={size * 2}
        height={size * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </Marker>
  )
}

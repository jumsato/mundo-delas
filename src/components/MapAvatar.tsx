import { Marker } from 'react-simple-maps'

interface AvatarBadge {
  emoji: string
  title?: string
  onClick: () => void
}

interface MapAvatarProps {
  id: string
  coordinates: [number, number]
  src: string
  size?: number
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  badges?: AvatarBadge[]
}

export function MapAvatar({ id, coordinates, src, size = 9, onClick, onMouseEnter, onMouseLeave, badges }: MapAvatarProps) {
  const clipId = `avatar-clip-${id}`
  const interactive = Boolean(onClick)
  const badgeR = Math.max(size * 0.55, 4)
  const badgeOffset = size * 0.85
  const badgeStep = badgeR * 2.2
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
      {badges?.map((badge, i) => (
        <g
          key={badge.emoji}
          transform={`translate(${badgeOffset + i * badgeStep}, ${badgeOffset})`}
          onClick={(e) => {
            e.stopPropagation()
            badge.onClick()
          }}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <circle r={badgeR} fill="#ffffff" stroke="rgba(20,22,30,0.25)" strokeWidth={0.5} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={badgeR * 1.3}>
            {badge.title ? <title>{badge.title}</title> : null}
            {badge.emoji}
          </text>
        </g>
      ))}
    </Marker>
  )
}

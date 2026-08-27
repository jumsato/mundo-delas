import { useState } from 'react'
import type { Level, Person, VisitRecord, WishlistOwner, WishlistRecord } from '../types'
import { COLOR_TOGETHER, PERSON_COLOR, wishlistColor } from '../lib/colors'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }
const LEVEL_TABS: { level: Level; label: string }[] = [
  { level: 'country', label: 'Países' },
  { level: 'state', label: 'Estados' },
  { level: 'city', label: 'Cidades' },
]

interface RankingListProps {
  title: string
  color: string
  entries: WishlistRecord
  level: Level
  onReorder: (orderedIds: string[]) => void
  onSelectEntity: (level: Level, id: string) => void
}

function RankingList({ title, color, entries, level, onReorder, onSelectEntity }: RankingListProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const ordered = Object.values(entries)
    .filter((e) => e.level === level)
    .sort((a, b) => a.rank - b.rank)

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = ordered.map((e) => e.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    onReorder(ids)
    setDragId(null)
  }

  return (
    <div className="sidebar-section">
      <h3>
        {title} ({ordered.length})
      </h3>
      {ordered.length === 0 && <p className="sidebar-empty">Nenhum ainda.</p>}
      <ol className="sidebar-list sidebar-ranking">
        {ordered.map((e) => (
          <li
            key={e.id}
            draggable
            onDragStart={() => setDragId(e.id)}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={() => handleDrop(e.id)}
            onClick={() => onSelectEntity(level, e.id)}
            className={dragId === e.id ? 'dragging' : ''}
          >
            <span className="rank-badge" style={{ background: color }}>
              {e.rank}
            </span>{' '}
            {e.name}
          </li>
        ))}
      </ol>
    </div>
  )
}

interface ColorListProps {
  title: string
  color: string
  entries: { id: string; name: string }[]
  onSelectEntity: (id: string) => void
}

function ColorList({ title, color, entries, onSelectEntity }: ColorListProps) {
  return (
    <div className="sidebar-section">
      <h3>
        {title} ({entries.length})
      </h3>
      {entries.length === 0 && <p className="sidebar-empty">Nenhum ainda.</p>}
      <ul className="sidebar-list">
        {entries.map((e) => (
          <li key={e.id} onClick={() => onSelectEntity(e.id)}>
            <span className="color-dot" style={{ background: color }} /> {e.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SidebarProps {
  person: Person
  visits: VisitRecord
  myWishlist: WishlistRecord
  sharedWishlist: WishlistRecord
  onReorderWishlist: (owner: WishlistOwner, level: Level, orderedIds: string[]) => void
  onSelectEntity: (level: Level, id: string) => void
}

export function Sidebar({ person, visits, myWishlist, sharedWishlist, onReorderWishlist, onSelectEntity }: SidebarProps) {
  const [activeLevel, setActiveLevel] = useState<Level>('country')
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'

  const all = Object.values(visits).filter((v) => v.level === activeLevel)
  const together = all.filter((v) => v.juliana && v.isa)
  const mine = all.filter((v) => v[person] && !v[other])
  const theirs = all.filter((v) => v[other] && !v[person])

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        {LEVEL_TABS.map((t) => (
          <button
            key={t.level}
            type="button"
            className={activeLevel === t.level ? 'sidebar-tab active' : 'sidebar-tab'}
            onClick={() => setActiveLevel(t.level)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ColorList
        title="Visitamos juntas"
        color={COLOR_TOGETHER}
        entries={together}
        onSelectEntity={(id) => onSelectEntity(activeLevel, id)}
      />

      <ColorList
        title="Só eu visitei"
        color={PERSON_COLOR[person]}
        entries={mine}
        onSelectEntity={(id) => onSelectEntity(activeLevel, id)}
      />

      <ColorList
        title={`Só ${PERSON_LABEL[other]} visitou`}
        color={PERSON_COLOR[other]}
        entries={theirs}
        onSelectEntity={(id) => onSelectEntity(activeLevel, id)}
      />

      <RankingList
        title="Minha lista de desejos"
        color={wishlistColor(person)}
        entries={myWishlist}
        level={activeLevel}
        onReorder={(ids) => onReorderWishlist(person, activeLevel, ids)}
        onSelectEntity={onSelectEntity}
      />

      <RankingList
        title="Lista de desejos compartilhada"
        color={wishlistColor('shared')}
        entries={sharedWishlist}
        level={activeLevel}
        onReorder={(ids) => onReorderWishlist('shared', activeLevel, ids)}
        onSelectEntity={onSelectEntity}
      />
    </aside>
  )
}

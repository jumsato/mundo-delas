import { useState } from 'react'
import type { Person, VisitRecord, WishlistOwner, WishlistRecord } from '../types'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }

interface RankingListProps {
  title: string
  entries: WishlistRecord
  onReorder: (orderedIds: string[]) => void
  onSelectCountry: (id: string) => void
}

function RankingList({ title, entries, onReorder, onSelectCountry }: RankingListProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const ordered = Object.values(entries).sort((a, b) => a.rank - b.rank)

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = ordered.map((e) => e.countryId)
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
      {ordered.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
      <ol className="sidebar-list sidebar-ranking">
        {ordered.map((e) => (
          <li
            key={e.countryId}
            draggable
            onDragStart={() => setDragId(e.countryId)}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={() => handleDrop(e.countryId)}
            onClick={() => onSelectCountry(e.countryId)}
            className={dragId === e.countryId ? 'dragging' : ''}
          >
            <span className="rank-badge">{e.rank}</span> {e.countryName}
          </li>
        ))}
      </ol>
    </div>
  )
}

interface SidebarProps {
  person: Person
  visits: VisitRecord
  myWishlist: WishlistRecord
  sharedWishlist: WishlistRecord
  onReorderWishlist: (owner: WishlistOwner, orderedIds: string[]) => void
  onSelectCountry: (id: string) => void
}

export function Sidebar({ person, visits, myWishlist, sharedWishlist, onReorderWishlist, onSelectCountry }: SidebarProps) {
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'
  const all = Object.values(visits)
  const together = all.filter((v) => v.juliana && v.isa)
  const mine = all.filter((v) => v[person] && !v[other])
  const theirs = all.filter((v) => v[other] && !v[person])

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Visitamos juntas ({together.length})</h3>
        {together.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
        <ul className="sidebar-list">
          {together.map((v) => (
            <li key={v.countryId} onClick={() => onSelectCountry(v.countryId)}>
              {v.countryName}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Só eu visitei ({mine.length})</h3>
        {mine.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
        <ul className="sidebar-list">
          {mine.map((v) => (
            <li key={v.countryId} onClick={() => onSelectCountry(v.countryId)}>
              {v.countryName}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Só {PERSON_LABEL[other]} visitou ({theirs.length})</h3>
        {theirs.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
        <ul className="sidebar-list">
          {theirs.map((v) => (
            <li key={v.countryId} onClick={() => onSelectCountry(v.countryId)}>
              {v.countryName}
            </li>
          ))}
        </ul>
      </div>

      <RankingList
        title="Minha lista de desejos"
        entries={myWishlist}
        onReorder={(ids) => onReorderWishlist(person, ids)}
        onSelectCountry={onSelectCountry}
      />

      <RankingList
        title="Lista de desejos compartilhada"
        entries={sharedWishlist}
        onReorder={(ids) => onReorderWishlist('shared', ids)}
        onSelectCountry={onSelectCountry}
      />
    </aside>
  )
}

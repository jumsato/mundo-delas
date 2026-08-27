import { useState } from 'react'
import type { CountryRecord } from '../types'

interface SidebarProps {
  records: CountryRecord
  onReorderWishlist: (orderedIds: string[]) => void
  onSelectCountry: (id: string) => void
}

export function Sidebar({ records, onReorderWishlist, onSelectCountry }: SidebarProps) {
  const [dragId, setDragId] = useState<string | null>(null)

  const all = Object.values(records)
  const visited = all.filter((e) => e.status === 'visited')
  const wishlist = all
    .filter((e) => e.status === 'wishlist')
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const ids = wishlist.map((e) => e.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    onReorderWishlist(ids)
    setDragId(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Já visitei ({visited.length})</h3>
        {visited.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
        <ul className="sidebar-list">
          {visited.map((e) => (
            <li key={e.id} onClick={() => onSelectCountry(e.id)}>
              {e.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Quero visitar — ranking ({wishlist.length})</h3>
        {wishlist.length === 0 && <p className="sidebar-empty">Nenhum país ainda.</p>}
        <ol className="sidebar-list sidebar-ranking">
          {wishlist.map((e) => (
            <li
              key={e.id}
              draggable
              onDragStart={() => setDragId(e.id)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => handleDrop(e.id)}
              onClick={() => onSelectCountry(e.id)}
              className={dragId === e.id ? 'dragging' : ''}
            >
              <span className="rank-badge">{e.rank}</span> {e.name}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

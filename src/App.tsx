import { useMemo, useState } from 'react'
import { WorldMap } from './components/WorldMap'
import { CountryModal } from './components/CountryModal'
import { Sidebar } from './components/Sidebar'
import { PersonSelector } from './components/PersonSelector'
import { usePerson } from './hooks/usePerson'
import { useSharedData } from './hooks/useSharedData'
import './App.css'

interface Selected {
  id: string
  name: string
}

function App() {
  const { person, setPerson } = usePerson()
  const { visits, wishlists, setVisited, addToWishlist, removeFromWishlist, reorderWishlist } = useSharedData()
  const [selected, setSelected] = useState<Selected | null>(null)

  const stats = useMemo(() => {
    const values = Object.values(visits).filter((v) => v.juliana || v.isa)
    return {
      together: values.filter((v) => v.juliana && v.isa).length,
      total: values.length,
    }
  }, [visits])

  if (!person) {
    return <PersonSelector onSelect={setPerson} />
  }

  function handleSelectFromSidebar(id: string) {
    const visit = visits[id]
    const wishlistEntry = wishlists[person!][id] ?? wishlists.shared[id]
    const name = visit?.countryName ?? wishlistEntry?.countryName
    if (name) setSelected({ id, name })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Mundo Delas</h1>
        <p className="app-subtitle">
          {stats.total} países marcados · {stats.together} visitados juntas
        </p>
      </header>

      <main className="app-main">
        <WorldMap
          person={person}
          visits={visits}
          wishlists={wishlists}
          onCountryChosen={(id, name) => setSelected({ id, name })}
        />
        <Sidebar
          person={person}
          visits={visits}
          myWishlist={wishlists[person]}
          sharedWishlist={wishlists.shared}
          onReorderWishlist={reorderWishlist}
          onSelectCountry={handleSelectFromSidebar}
        />
      </main>

      {selected && (
        <CountryModal
          countryId={selected.id}
          countryName={selected.name}
          person={person}
          visit={visits[selected.id]}
          myWishlist={wishlists[person]}
          sharedWishlist={wishlists.shared}
          onSetVisited={(visited) => setVisited(selected.id, selected.name, person, visited)}
          onToggleMyWishlist={() =>
            wishlists[person][selected.id]
              ? removeFromWishlist(person, selected.id)
              : addToWishlist(person, selected.id, selected.name)
          }
          onToggleSharedWishlist={() =>
            wishlists.shared[selected.id]
              ? removeFromWishlist('shared', selected.id)
              : addToWishlist('shared', selected.id, selected.name)
          }
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export default App

import { useMemo, useState } from 'react'
import { WorldMap } from './components/WorldMap'
import { CountryModal } from './components/CountryModal'
import { Sidebar } from './components/Sidebar'
import { useCountryData } from './hooks/useCountryData'
import './App.css'

interface Selected {
  id: string
  name: string
}

function App() {
  const { records, markVisited, markWishlist, clearCountry, reorderWishlist } = useCountryData()
  const [selected, setSelected] = useState<Selected | null>(null)

  const stats = useMemo(() => {
    const values = Object.values(records)
    return {
      visited: values.filter((e) => e.status === 'visited').length,
      wishlist: values.filter((e) => e.status === 'wishlist').length,
    }
  }, [records])

  function handleSelectFromSidebar(id: string) {
    const entry = records[id]
    if (entry) setSelected({ id, name: entry.name })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Mundo Delas</h1>
        <p className="app-subtitle">
          Clique nos países para explorar o mapa. {stats.visited} visitados · {stats.wishlist} na lista de desejos.
        </p>
      </header>

      <main className="app-main">
        <WorldMap records={records} onCountryChosen={(id, name) => setSelected({ id, name })} />
        <Sidebar records={records} onReorderWishlist={reorderWishlist} onSelectCountry={handleSelectFromSidebar} />
      </main>

      {selected && (
        <CountryModal
          countryId={selected.id}
          countryName={selected.name}
          entry={records[selected.id]}
          onVisited={() => {
            markVisited(selected.id, selected.name)
            setSelected(null)
          }}
          onWishlist={() => {
            markWishlist(selected.id, selected.name)
            setSelected(null)
          }}
          onClear={() => {
            clearCountry(selected.id)
            setSelected(null)
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export default App

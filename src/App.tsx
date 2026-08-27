import { useMemo, useState } from 'react'
import { WorldMap } from './components/WorldMap'
import { StateMap } from './components/StateMap'
import { CityMap } from './components/CityMap'
import { CountryModal } from './components/CountryModal'
import { Sidebar } from './components/Sidebar'
import { PersonSelector } from './components/PersonSelector'
import { CountrySearch } from './components/CountrySearch'
import { StatsPanel } from './components/StatsPanel'
import { usePerson } from './hooks/usePerson'
import { useSharedData } from './hooks/useSharedData'
import geoIndex from './data/geo-index.json'
import type { CityEntry, Level } from './types'
import type { Feature } from 'geojson'
import { aggregateVisits } from './lib/aggregateVisits'
import './App.css'

interface CountryNav {
  level: 'country'
  id: string
  name: string
}

interface StateNav {
  level: 'state'
  id: string
  name: string
  countryId: string
  countryName: string
  feature: Feature
}

type Nav = CountryNav | StateNav | null

interface Selected {
  level: Level
  id: string
  name: string
  countryId?: string
  stateId?: string
}

const hasStates = new Set(geoIndex.hasStates)
const hasCities = new Set(geoIndex.hasCities)

function App() {
  const { person, setPerson } = usePerson()
  const { visits, wishlists, setVisited, setVisitMeta, addToWishlist, removeFromWishlist, reorderWishlist } = useSharedData()
  const [nav, setNav] = useState<Nav>(null)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [showStats, setShowStats] = useState(false)

  const stats = useMemo(() => {
    const countryStatus = aggregateVisits(visits, (v) => (v.level === 'country' ? v.id : v.countryId))
    const statuses = [...countryStatus.values()]
    return {
      together: statuses.filter((s) => s.juliana && s.isa).length,
      total: statuses.length,
    }
  }, [visits])

  if (!person) {
    return <PersonSelector onSelect={setPerson} />
  }

  function handleCountryChosen(id: string, name: string) {
    if (hasStates.has(id)) {
      setNav({ level: 'country', id, name })
    } else {
      setSelected({ level: 'country', id, name })
    }
  }

  function handleStateChosen(feature: Feature) {
    if (nav?.level !== 'country') return
    const props = feature.properties as { id: string; name: string }
    if (hasCities.has(nav.id)) {
      setNav({ level: 'state', id: props.id, name: props.name, countryId: nav.id, countryName: nav.name, feature })
    } else {
      setSelected({ level: 'state', id: props.id, name: props.name, countryId: nav.id })
    }
  }

  function handleCityChosen(city: CityEntry) {
    if (nav?.level !== 'state') return
    setSelected({ level: 'city', id: city.id, name: city.name, countryId: nav.countryId, stateId: nav.id })
  }

  function handleSelectFromSidebar(level: Level, id: string) {
    const visit = visits[`${level}:${id}`]
    const wishlistEntry = wishlists[person!][`${level}:${id}`] ?? wishlists.shared[`${level}:${id}`]
    const name = visit?.name ?? wishlistEntry?.name
    if (name) setSelected({ level, id, name, countryId: visit?.countryId, stateId: visit?.stateId })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <div>
            <h1>Mundo Delas</h1>
            <p className="app-subtitle">
              {stats.total} países marcados · {stats.together} visitados juntas
            </p>
          </div>
          <div className="app-header-actions">
            <CountrySearch onSelect={handleCountryChosen} />
            <button type="button" className="btn-stats" onClick={() => setShowStats(true)}>
              📊 Estatísticas
            </button>
          </div>
        </div>
      </header>

      <div className="breadcrumb">
        <button type="button" className="crumb" onClick={() => setNav(null)} disabled={nav === null}>
          Mundo
        </button>
        {nav && (
          <>
            <span className="crumb-sep">›</span>
            <button
              type="button"
              className="crumb"
              onClick={() => setNav(nav.level === 'state' ? { level: 'country', id: nav.countryId, name: nav.countryName } : nav)}
            >
              {nav.level === 'state' ? nav.countryName : nav.name}
            </button>
            <button
              type="button"
              className="btn-mark-crumb"
              onClick={() =>
                setSelected(
                  nav.level === 'state'
                    ? { level: 'country', id: nav.countryId, name: nav.countryName }
                    : { level: 'country', id: nav.id, name: nav.name },
                )
              }
            >
              Marcar país
            </button>
          </>
        )}
        {nav?.level === 'state' && (
          <>
            <span className="crumb-sep">›</span>
            <button type="button" className="crumb" disabled>
              {nav.name}
            </button>
            <button
              type="button"
              className="btn-mark-crumb"
              onClick={() => setSelected({ level: 'state', id: nav.id, name: nav.name, countryId: nav.countryId })}
            >
              Marcar estado
            </button>
          </>
        )}
      </div>

      <main className="app-main">
        {nav === null && (
          <WorldMap person={person} visits={visits} wishlists={wishlists} onCountryChosen={handleCountryChosen} />
        )}
        {nav?.level === 'country' && (
          <StateMap
            countryId={nav.id}
            person={person}
            visits={visits}
            wishlists={wishlists}
            onStateChosen={handleStateChosen}
          />
        )}
        {nav?.level === 'state' && (
          <CityMap
            countryId={nav.countryId}
            stateId={nav.id}
            stateFeature={nav.feature}
            person={person}
            visits={visits}
            wishlists={wishlists}
            onCityChosen={handleCityChosen}
          />
        )}
        <Sidebar
          person={person}
          visits={visits}
          myWishlist={wishlists[person]}
          sharedWishlist={wishlists.shared}
          onReorderWishlist={reorderWishlist}
          onSelectEntity={handleSelectFromSidebar}
        />
      </main>

      {selected && (
        <CountryModal
          level={selected.level}
          entityId={selected.id}
          entityName={selected.name}
          person={person}
          visit={visits[`${selected.level}:${selected.id}`]}
          myWishlist={wishlists[person]}
          sharedWishlist={wishlists.shared}
          onSetVisited={(visited) =>
            setVisited(selected.level, selected.id, selected.name, person, visited, {
              countryId: selected.countryId,
              stateId: selected.stateId,
            })
          }
          onUpdateMeta={(patch) => setVisitMeta(selected.level, selected.id, person, patch)}
          onToggleMyWishlist={() =>
            wishlists[person][`${selected.level}:${selected.id}`]
              ? removeFromWishlist(person, selected.level, selected.id)
              : addToWishlist(person, selected.level, selected.id, selected.name)
          }
          onToggleSharedWishlist={() =>
            wishlists.shared[`${selected.level}:${selected.id}`]
              ? removeFromWishlist('shared', selected.level, selected.id)
              : addToWishlist('shared', selected.level, selected.id, selected.name)
          }
          onClose={() => setSelected(null)}
        />
      )}

      {showStats && <StatsPanel person={person} visits={visits} onClose={() => setShowStats(false)} />}
    </div>
  )
}

export default App

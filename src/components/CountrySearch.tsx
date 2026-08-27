import { useMemo, useState } from 'react'
import countryNames from '../data/country-names.json'

interface CountrySearchProps {
  onSelect: (id: string, name: string) => void
}

export function CountrySearch({ onSelect }: CountrySearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return countryNames.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  function pick(id: string, name: string) {
    onSelect(id, name)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="country-search">
      <input
        type="text"
        className="country-search-input"
        placeholder="Buscar país…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <ul className="country-search-results">
          {matches.map((c) => (
            <li key={c.id} onMouseDown={() => pick(c.id, c.name)}>
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import type { Person } from '../types'

interface PersonSelectorProps {
  onSelect: (person: Person) => void
}

export function PersonSelector({ onSelect }: PersonSelectorProps) {
  return (
    <div className="person-select-screen">
      <h1>Mundo Delas</h1>
      <p>Quem é você?</p>
      <div className="person-select-options">
        <button type="button" className="person-card" onClick={() => onSelect('juliana')}>
          <img src={julianaAvatar} alt="Juliana" />
          <span>Sou a Juliana</span>
        </button>
        <button type="button" className="person-card" onClick={() => onSelect('isa')}>
          <img src={isaAvatar} alt="Isa" />
          <span>Sou a Isa</span>
        </button>
      </div>
    </div>
  )
}

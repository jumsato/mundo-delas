import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'
import type { Level, Person, VisitEntry, WishlistRecord } from '../types'
import { PERSON_COLOR, wishlistColor } from '../lib/colors'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }
const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }
const LEVEL_LABEL: Record<Level, string> = { country: 'país', state: 'estado', city: 'cidade' }

interface EntityModalProps {
  level: Level
  entityId: string
  entityName: string
  person: Person
  visit?: VisitEntry
  myWishlist: WishlistRecord
  sharedWishlist: WishlistRecord
  onSetVisited: (visited: boolean) => void
  onToggleMyWishlist: () => void
  onToggleSharedWishlist: () => void
  onClose: () => void
}

interface StatusToggleProps {
  active: boolean
  color: string
  activeLabel: string
  inactiveLabel: string
  onActivate: () => void
  onClear: () => void
}

function StatusToggle({ active, color, activeLabel, inactiveLabel, onActivate, onClear }: StatusToggleProps) {
  if (!active) {
    return (
      <button type="button" className="btn btn-ghost" onClick={onActivate}>
        {inactiveLabel}
      </button>
    )
  }
  return (
    <div className="status-toggle">
      <span className="status-pill" style={{ background: color }}>
        {activeLabel}
      </span>
      <button type="button" className="btn-unmark" onClick={onClear}>
        Desmarcar
      </button>
    </div>
  )
}

export function CountryModal({
  level,
  entityId,
  entityName,
  person,
  visit,
  myWishlist,
  sharedWishlist,
  onSetVisited,
  onToggleMyWishlist,
  onToggleSharedWishlist,
  onClose,
}: EntityModalProps) {
  const other: Person = person === 'juliana' ? 'isa' : 'juliana'
  const iVisited = Boolean(visit?.[person])
  const otherVisited = Boolean(visit?.[other])
  const together = iVisited && otherVisited
  const wishlistKey = `${level}:${entityId}`
  const inMyWishlist = Boolean(myWishlist[wishlistKey])
  const inSharedWishlist = Boolean(sharedWishlist[wishlistKey])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <span className="modal-level-tag">{LEVEL_LABEL[level]}</span>
        <h2>{entityName}</h2>

        {together && (
          <div className="together-banner">
            <img src={togetherAvatar} alt="Vocês duas" />
            <span>Visitaram juntas! 🎉</span>
          </div>
        )}

        <div className="visit-row">
          <img className="avatar-sm" src={PERSON_AVATAR[person]} alt={PERSON_LABEL[person]} />
          <span>Você ({PERSON_LABEL[person]})</span>
          <StatusToggle
            active={iVisited}
            color={PERSON_COLOR[person]}
            activeLabel="✓ Já visitei"
            inactiveLabel="Marcar como visitado"
            onActivate={() => onSetVisited(true)}
            onClear={() => onSetVisited(false)}
          />
        </div>

        <div className="visit-row">
          <img className="avatar-sm" src={PERSON_AVATAR[other]} alt={PERSON_LABEL[other]} />
          <span>{PERSON_LABEL[other]}</span>
          <span className="visit-status">
            {otherVisited ? (
              <>
                <span className="color-dot" style={{ background: PERSON_COLOR[other] }} /> já visitou
              </>
            ) : (
              'ainda não visitou'
            )}
          </span>
        </div>

        <div className="wishlist-section">
          <StatusToggle
            active={inMyWishlist}
            color={wishlistColor(person)}
            activeLabel="★ Na minha lista de desejos"
            inactiveLabel="Adicionar à minha lista de desejos"
            onActivate={onToggleMyWishlist}
            onClear={onToggleMyWishlist}
          />
          <StatusToggle
            active={inSharedWishlist}
            color={wishlistColor('shared')}
            activeLabel="★ Na lista compartilhada"
            inactiveLabel="Adicionar à lista compartilhada"
            onActivate={onToggleSharedWishlist}
            onClear={onToggleSharedWishlist}
          />
        </div>
      </div>
    </div>
  )
}

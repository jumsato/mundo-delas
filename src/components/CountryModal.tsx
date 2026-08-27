import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'
import type { Level, Person, VisitEntry, WishlistRecord } from '../types'

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
          <button
            type="button"
            className={iVisited ? 'btn btn-visited' : 'btn btn-ghost'}
            onClick={() => onSetVisited(!iVisited)}
          >
            {iVisited ? '✓ Já visitei' : 'Marcar como visitado'}
          </button>
        </div>

        <div className="visit-row">
          <img className="avatar-sm" src={PERSON_AVATAR[other]} alt={PERSON_LABEL[other]} />
          <span>{PERSON_LABEL[other]}</span>
          <span className="visit-status">{otherVisited ? '✓ já visitou' : 'ainda não visitou'}</span>
        </div>

        <div className="wishlist-section">
          <button type="button" className={inMyWishlist ? 'btn btn-wishlist' : 'btn btn-ghost'} onClick={onToggleMyWishlist}>
            {inMyWishlist ? '★ Na minha lista de desejos' : 'Adicionar à minha lista de desejos'}
          </button>
          <button
            type="button"
            className={inSharedWishlist ? 'btn btn-wishlist' : 'btn btn-ghost'}
            onClick={onToggleSharedWishlist}
          >
            {inSharedWishlist ? '★ Na lista compartilhada' : 'Adicionar à lista compartilhada'}
          </button>
        </div>
      </div>
    </div>
  )
}

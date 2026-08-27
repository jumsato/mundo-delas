import { useRef, useState } from 'react'
import julianaAvatar from '../assets/avatars/juliana.jpeg'
import isaAvatar from '../assets/avatars/isa.jpeg'
import togetherAvatar from '../assets/avatars/together.jpeg'
import type { Level, Person, PersonVisitMeta, VisitEntry, WishlistRecord } from '../types'
import { PERSON_COLOR, wishlistColor } from '../lib/colors'
import { resizeImageFile } from '../lib/resizeImage'

const PERSON_LABEL: Record<Person, string> = { juliana: 'Juliana', isa: 'Isa' }
const PERSON_AVATAR: Record<Person, string> = { juliana: julianaAvatar, isa: isaAvatar }
const LEVEL_LABEL: Record<Level, string> = { country: 'país', state: 'estado', city: 'cidade' }

type MetaPatch = Partial<Record<keyof PersonVisitMeta, string | null>>

interface EntityModalProps {
  level: Level
  entityId: string
  entityName: string
  person: Person
  visit?: VisitEntry
  myWishlist: WishlistRecord
  sharedWishlist: WishlistRecord
  onSetVisited: (visited: boolean) => void
  onUpdateMeta: (patch: MetaPatch) => void
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

interface VisitMetaEditorProps {
  meta: PersonVisitMeta
  onUpdateMeta: (patch: MetaPatch) => void
}

function VisitMetaEditor({ meta, onUpdateMeta }: VisitMetaEditorProps) {
  const [noteDraft, setNoteDraft] = useState(meta.note ?? '')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      const dataUrl = await resizeImageFile(file)
      onUpdateMeta({ photo: dataUrl })
    } catch {
      setPhotoError('Não foi possível usar essa foto.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="visit-meta">
      <label className="visit-meta-field">
        <span>Quando foi?</span>
        <input
          type="date"
          value={meta.date ?? ''}
          onChange={(e) => onUpdateMeta({ date: e.target.value || null })}
        />
      </label>

      <label className="visit-meta-field">
        <span>Anotações</span>
        <textarea
          rows={2}
          placeholder="O que rolou nessa viagem?"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (noteDraft !== (meta.note ?? '')) onUpdateMeta({ note: noteDraft || null })
          }}
        />
      </label>

      <div className="visit-meta-field">
        <span>Foto da viagem</span>
        {meta.photo ? (
          <div className="visit-photo-row">
            <img className="visit-photo-thumb" src={meta.photo} alt="Foto da viagem" />
            <button type="button" className="btn-unmark" onClick={() => onUpdateMeta({ photo: null })}>
              Remover foto
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={photoBusy}>
            {photoBusy ? 'Enviando…' : 'Adicionar foto'}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
        {photoError && <span className="visit-meta-error">{photoError}</span>}
      </div>
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
  onUpdateMeta,
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
  const myMeta = visit?.meta?.[person] ?? {}

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

        {iVisited && <VisitMetaEditor meta={myMeta} onUpdateMeta={onUpdateMeta} />}

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

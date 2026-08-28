import type { PersonVisitMeta } from '../types'
import { VisitMetaEditor } from './VisitMetaEditor'

interface MemoriesModalProps {
  countryName: string
  meta: PersonVisitMeta
  onUpdateMeta: (patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (dataUrl: string) => void
  onRemovePhoto: (dataUrl: string) => void
  onClose: () => void
}

export function MemoriesModal({ countryName, meta, onUpdateMeta, onAddPhoto, onRemovePhoto, onClose }: MemoriesModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card memories-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <span className="modal-level-tag">lembranças</span>
        <h2>{countryName}</h2>
        <VisitMetaEditor meta={meta} onUpdateMeta={onUpdateMeta} onAddPhoto={onAddPhoto} onRemovePhoto={onRemovePhoto} />
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { PersonVisitMeta } from '../types'
import { MemoriesModal } from './MemoriesModal'

interface MemoriesTriggerProps {
  title: string
  meta: PersonVisitMeta
  onUpdateMeta: (patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (dataUrl: string) => void
  onRemovePhoto: (dataUrl: string) => void
}

export function MemoriesTrigger({ title, meta, onUpdateMeta, onAddPhoto, onRemovePhoto }: MemoriesTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="map-fab"
        onClick={() => setOpen(true)}
        title={`Lembranças de ${title}`}
        aria-label={`Lembranças de ${title}`}
      >
        📷
      </button>
      {open && (
        <MemoriesModal
          title={title}
          meta={meta}
          onUpdateMeta={onUpdateMeta}
          onAddPhoto={onAddPhoto}
          onRemovePhoto={onRemovePhoto}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

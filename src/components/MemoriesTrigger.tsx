import { useState } from 'react'
import type { PersonVisitMeta } from '../types'
import { MemoriesModal } from './MemoriesModal'

interface MemoriesTriggerProps {
  countryName: string
  meta: PersonVisitMeta
  onUpdateMeta: (patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (dataUrl: string) => void
  onRemovePhoto: (dataUrl: string) => void
}

export function MemoriesTrigger({ countryName, meta, onUpdateMeta, onAddPhoto, onRemovePhoto }: MemoriesTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="map-fab"
        onClick={() => setOpen(true)}
        title={`Lembranças de ${countryName}`}
        aria-label={`Lembranças de ${countryName}`}
      >
        📷
      </button>
      {open && (
        <MemoriesModal
          countryName={countryName}
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

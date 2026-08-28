import { useRef, useState } from 'react'
import type { PersonVisitMeta } from '../types'
import { resizeImageFile } from '../lib/resizeImage'

const MAX_PHOTOS = 6

export interface VisitMetaEditorProps {
  meta: PersonVisitMeta
  onUpdateMeta: (patch: Partial<Record<'date' | 'note', string | null>>) => void
  onAddPhoto: (dataUrl: string) => void
  onRemovePhoto: (dataUrl: string) => void
}

export function VisitMetaEditor({ meta, onUpdateMeta, onAddPhoto, onRemovePhoto }: VisitMetaEditorProps) {
  const [noteDraft, setNoteDraft] = useState(meta.note ?? '')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photos = meta.photos ?? []

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      const dataUrl = await resizeImageFile(file)
      onAddPhoto(dataUrl)
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
        <span>
          Fotos da viagem ({photos.length}/{MAX_PHOTOS})
        </span>
        {photos.length > 0 && (
          <div className="visit-photo-grid">
            {photos.map((src) => (
              <div className="visit-photo-item" key={src}>
                <img className="visit-photo-thumb" src={src} alt="Foto da viagem" />
                <button type="button" className="visit-photo-remove" onClick={() => onRemovePhoto(src)} aria-label="Remover foto">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < MAX_PHOTOS && (
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

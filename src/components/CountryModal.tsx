import type { CountryEntry } from '../types'

interface CountryModalProps {
  countryId: string
  countryName: string
  entry?: CountryEntry
  onVisited: () => void
  onWishlist: () => void
  onClear: () => void
  onClose: () => void
}

export function CountryModal({ countryName, entry, onVisited, onWishlist, onClear, onClose }: CountryModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2>{countryName}</h2>

        {!entry && (
          <>
            <p>Você já visitou este país?</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-visited" onClick={onVisited}>
                Já visitei
              </button>
              <button type="button" className="btn btn-wishlist" onClick={onWishlist}>
                Ainda não — quero visitar
              </button>
            </div>
          </>
        )}

        {entry?.status === 'visited' && (
          <>
            <p className="modal-status modal-status-visited">✓ Marcado como visitado</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-wishlist" onClick={onWishlist}>
                Mover para lista de desejos
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClear}>
                Remover marcação
              </button>
            </div>
          </>
        )}

        {entry?.status === 'wishlist' && (
          <>
            <p className="modal-status modal-status-wishlist">
              ★ Na lista de desejos {entry.rank ? `— posição #${entry.rank}` : ''}
            </p>
            <p className="modal-hint">Ajuste o ranking na barra lateral, arrastando os países.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-visited" onClick={onVisited}>
                Já visitei
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClear}>
                Remover marcação
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

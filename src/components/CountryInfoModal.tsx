import { useEffect, useState } from 'react'
import { fetchCountryGuide, fetchCountryPhotos, type CountryGuideInfo } from '../lib/wikiCountryInfo'
import { estimateTripCost } from '../lib/costTier'
import type { Level } from '../types'

interface CountryInfoModalProps {
  countryId: string
  countryName: string
  level?: Level
  // the country the state/city belongs to — disambiguates a state/city name
  // that collides with another Wikipedia article (e.g. "Fukushima" the
  // prefecture vs. the disaster, "Matsumoto" the city vs. the surname).
  hint?: string
  onClose: () => void
}

type LoadState = 'loading' | 'ready' | 'error'

export function CountryInfoModal({ countryId, countryName, level = 'country', hint, onClose }: CountryInfoModalProps) {
  const [info, setInfo] = useState<CountryGuideInfo | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setInfo(null)
    setPhotos([])
    fetchCountryGuide(countryName, hint).then((result) => {
      if (cancelled) return
      setInfo(result)
      setState(result ? 'ready' : 'error')
      if (result) {
        fetchCountryPhotos(result.lang, result.title).then((imgs) => {
          if (!cancelled) setPhotos(imgs)
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [countryName, hint])

  const cost = estimateTripCost(countryId, countryName)
  const heroPhoto = photos[0] ?? info?.thumbnail
  const galleryPhotos = photos[0] ? photos.slice(1) : photos

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card info-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        {heroPhoto && (
          <div className="info-hero" style={{ backgroundImage: `url(${heroPhoto})` }}>
            <div className="info-hero-fade" />
            <h2 className="info-hero-title">{countryName}</h2>
          </div>
        )}
        {!heroPhoto && <h2 className="info-title-plain">{countryName}</h2>}

        <div className="info-body">
          {state === 'loading' && <p className="country-guide-loading">Carregando informações…</p>}
          {state === 'error' && <p className="country-guide-loading">Não conseguimos carregar um resumo agora.</p>}

          {info && (
            <>
              <p className="info-extract">{info.extract}</p>
              <a className="country-guide-link" href={info.pageUrl} target="_blank" rel="noreferrer">
                Ler mais na Wikipédia{info.lang === 'en' ? ' (em inglês)' : ''} ↗
              </a>
            </>
          )}

          {galleryPhotos.length > 0 && (
            <div className="info-gallery">
              {galleryPhotos.map((src) => (
                <img key={src} src={src} alt={countryName} loading="lazy" />
              ))}
            </div>
          )}

          {level === 'country' && (
            <div className="country-guide-cost">
              <span className="country-guide-cost-label">Custo estimado · viagem de 15 dias</span>
              <span className="country-guide-cost-value">
                US$ {cost.totalUsd15d[0]}–{cost.totalUsd15d[1]} por pessoa
              </span>
              <span className="country-guide-cost-tier">
                Nível de custo: <strong>{cost.tier}</strong> (~US$ {cost.dailyUsd[0]}–{cost.dailyUsd[1]}/dia com
                hospedagem, comida e transporte local)
              </span>
              <span className="country-guide-cost-note">
                Estimativa aproximada, não inclui passagem aérea internacional — varia bastante conforme o estilo de
                viagem.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

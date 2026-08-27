import { useEffect, useState } from 'react'
import { fetchCountryGuide, type CountryGuideInfo } from '../lib/wikiCountryInfo'
import { estimateTripCost } from '../lib/costTier'

interface CountryGuideProps {
  countryId: string
  countryName: string
}

type LoadState = 'loading' | 'ready' | 'error'

export function CountryGuide({ countryId, countryName }: CountryGuideProps) {
  const [info, setInfo] = useState<CountryGuideInfo | null>(null)
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setInfo(null)
    fetchCountryGuide(countryName).then((result) => {
      if (cancelled) return
      setInfo(result)
      setState(result ? 'ready' : 'error')
    })
    return () => {
      cancelled = true
    }
  }, [countryName])

  const cost = estimateTripCost(countryId, countryName)

  return (
    <div className="country-guide">
      <h3 className="country-guide-title">Sobre o país</h3>

      {state === 'loading' && <p className="country-guide-loading">Carregando informações…</p>}
      {state === 'error' && <p className="country-guide-loading">Não conseguimos carregar um resumo agora.</p>}

      {info && (
        <div className="country-guide-body">
          {info.thumbnail && <img className="country-guide-thumb" src={info.thumbnail} alt={countryName} />}
          <div>
            <p className="country-guide-extract">{info.extract}</p>
            <a className="country-guide-link" href={info.pageUrl} target="_blank" rel="noreferrer">
              Ler mais na Wikipédia{info.lang === 'en' ? ' (em inglês)' : ''} ↗
            </a>
          </div>
        </div>
      )}

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
    </div>
  )
}

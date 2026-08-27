import { useState } from 'react'
import { CountryInfoModal } from './CountryInfoModal'

interface CountryInfoTriggerProps {
  countryId: string
  countryName: string
}

export function CountryInfoTrigger({ countryId, countryName }: CountryInfoTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="country-info-fab"
        onClick={() => setOpen(true)}
        title={`Curiosidades sobre ${countryName}`}
        aria-label={`Curiosidades sobre ${countryName}`}
      >
        💡
      </button>
      {open && <CountryInfoModal countryId={countryId} countryName={countryName} onClose={() => setOpen(false)} />}
    </>
  )
}

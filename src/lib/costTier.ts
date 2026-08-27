import { regionForCountry } from './countryRegion'

export type CostTier = 'baixo' | 'médio' | 'alto' | 'muito alto'

export interface CostEstimate {
  tier: CostTier
  dailyUsd: [number, number]
  totalUsd15d: [number, number]
}

const DAILY_RANGE_USD: Record<CostTier, [number, number]> = {
  baixo: [25, 60],
  médio: [50, 100],
  alto: [90, 160],
  'muito alto': [150, 280],
}

const TIER_BY_SUBREGION: Record<string, CostTier> = {
  'Northern America': 'alto',
  'Northern Europe': 'alto',
  'Western Europe': 'alto',
  'Southern Europe': 'médio',
  'Eastern Europe': 'baixo',
  'Australia and New Zealand': 'alto',
  'Latin America and the Caribbean': 'baixo',
  'Sub-Saharan Africa': 'baixo',
  'Northern Africa': 'baixo',
  'Western Asia': 'médio',
  'Central Asia': 'baixo',
  'Southern Asia': 'baixo',
  'South-eastern Asia': 'baixo',
  'Eastern Asia': 'médio',
  Melanesia: 'médio',
  Micronesia: 'médio',
  Polynesia: 'médio',
}

const TIER_BY_REGION: Record<string, CostTier> = {
  Africa: 'baixo',
  Americas: 'baixo',
  Asia: 'baixo',
  Europe: 'médio',
  Oceania: 'médio',
}

// Well-known outliers where the sub-region average doesn't hold, keyed by the
// exact country name as it appears in the world map dataset.
const NAME_OVERRIDES: Record<string, CostTier> = {
  Switzerland: 'muito alto',
  Norway: 'muito alto',
  Iceland: 'muito alto',
  Denmark: 'muito alto',
  Luxembourg: 'muito alto',
  Singapore: 'muito alto',
  Qatar: 'muito alto',
  'United Arab Emirates': 'muito alto',
  Japan: 'alto',
  'South Korea': 'alto',
  Israel: 'alto',
  'New Zealand': 'alto',
}

function round(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function estimateTripCost(countryId: string, countryName: string): CostEstimate {
  const override = NAME_OVERRIDES[countryName]
  const region = regionForCountry(countryId)
  const tier: CostTier =
    override ??
    (region?.subRegion && TIER_BY_SUBREGION[region.subRegion]) ??
    (region?.region && TIER_BY_REGION[region.region]) ??
    'médio'

  const [lo, hi] = DAILY_RANGE_USD[tier]
  return {
    tier,
    dailyUsd: [lo, hi],
    totalUsd15d: [round(lo * 15, 50), round(hi * 15, 50)],
  }
}

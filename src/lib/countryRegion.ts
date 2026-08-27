import countryRegionData from '../data/country-region.json'

interface RegionInfo {
  region: string | null
  subRegion: string | null
}

const DATA = countryRegionData as Record<string, RegionInfo>

// World atlas country ids come as strings like "076" (sometimes zero-padded,
// sometimes not depending on the source); normalize before lookup.
function normalize(countryId: string): string {
  return String(parseInt(countryId, 10))
}

export function regionForCountry(countryId: string): RegionInfo | null {
  return DATA[normalize(countryId)] ?? null
}

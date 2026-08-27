// One-off data pipeline: turns raw Natural Earth admin-1 (states/provinces) and
// populated-places (cities) datasets into small per-country files the app can
// lazy-load. Not part of the app build — run manually with `node scripts/build-geo-data.mjs`
// whenever the source data needs refreshing.
//
// Before running, download the raw source files into ./raw-data/ (gitignored):
//   raw-data/admin1_10m_full.geojson
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
//   raw-data/places_10m.geojson
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson
//   raw-data/iso_codes.json
//     https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.json
import fs from 'node:fs'
import path from 'node:path'
import { geoContains, geoCentroid } from 'd3-geo'
import simplify from '@turf/simplify'

const SCRATCH = path.resolve('raw-data')
const OUT_STATES = path.resolve('public/data/states')
const OUT_CITIES = path.resolve('public/data/cities')

fs.mkdirSync(OUT_STATES, { recursive: true })
fs.mkdirSync(OUT_CITIES, { recursive: true })

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

const isoCodes = loadJSON(path.join(SCRATCH, 'iso_codes.json'))
const numericToAlpha3 = new Map()
const alpha3ToNumeric = new Map()
for (const c of isoCodes) {
  const numeric = c['country-code']
  const alpha3 = c['alpha-3']
  if (numeric && alpha3) {
    numericToAlpha3.set(numeric, alpha3)
    alpha3ToNumeric.set(alpha3, numeric)
  }
}

const admin1 = loadJSON(path.join(SCRATCH, 'admin1_10m_full.geojson'))
const places = loadJSON(path.join(SCRATCH, 'places_10m.geojson'))

function round(n) {
  return Math.round(n * 10000) / 10000
}

function roundCoords(coords) {
  if (typeof coords[0] === 'number') return coords.map(round)
  return coords.map(roundCoords)
}

// Group admin-1 features by country (adm0_a3)
const statesByCountry = new Map()
for (const f of admin1.features) {
  const cc = f.properties.adm0_a3
  if (!cc) continue
  if (!statesByCountry.has(cc)) statesByCountry.set(cc, [])
  statesByCountry.get(cc).push(f)
}

// Group cities by country (ADM0_A3)
const citiesByCountry = new Map()
for (const f of places.features) {
  const cc = f.properties.ADM0_A3
  if (!cc) continue
  if (!citiesByCountry.has(cc)) citiesByCountry.set(cc, [])
  citiesByCountry.get(cc).push(f)
}

function centroidOf(feature) {
  // spherically-aware centroid: a naive average of ring points breaks for
  // shapes crossing the antimeridian (e.g. Alaska, Russia), averaging +179
  // and -179 down to ~0 instead of ~180.
  return geoCentroid(feature)
}

// Remote open-ocean points, nowhere near any coastline: if a simplified polygon
// claims to contain one of these, its ring topology got broken by simplification
// (classic failure mode for shapes that cross the antimeridian, like Alaska or
// Russia) and geoContains would then wrongly match huge parts of the globe.
const OCEAN_SANITY_POINTS = [
  [-150, 0],
  [-30, 0],
  [80, -40],
  [-25, -50],
  [160, -20],
]

function isTopologyBroken(feature) {
  return OCEAN_SANITY_POINTS.some((p) => {
    try {
      return geoContains(feature, p)
    } catch {
      return true
    }
  })
}

const geoIndex = { hasStates: [], hasCities: [] }
let countriesProcessed = 0
let brokenSimplifications = 0

for (const [alpha3, rawFeatures] of statesByCountry) {
  const numericId = alpha3ToNumeric.get(alpha3)
  if (!numericId) continue

  const simplifiedFeatures = rawFeatures.map((f) => {
    let geom = f.geometry
    try {
      const simplified = simplify(
        { type: 'Feature', properties: {}, geometry: geom },
        { tolerance: 0.01, highQuality: false },
      )
      if (isTopologyBroken(simplified)) {
        brokenSimplifications++
        geom = f.geometry
      } else {
        geom = simplified.geometry
      }
    } catch {
      // keep original geometry if simplify fails on a degenerate shape
    }
    geom = { ...geom, coordinates: roundCoords(geom.coordinates) }
    return {
      type: 'Feature',
      properties: { id: f.properties.adm1_code, name: f.properties.name },
      geometry: geom,
      centroid: centroidOf(f),
    }
  })

  const stateFC = {
    type: 'FeatureCollection',
    features: simplifiedFeatures.map(({ centroid, ...f }) => f),
  }
  fs.writeFileSync(path.join(OUT_STATES, `${numericId}.json`), JSON.stringify(stateFC))
  geoIndex.hasStates.push(numericId)

  // Assign cities of this country to the state polygon that contains them
  const cities = citiesByCountry.get(alpha3) || []
  const cityEntries = cities.map((c) => {
    const lon = c.properties.LONGITUDE
    const lat = c.properties.LATITUDE
    let stateId = null
    for (const sf of simplifiedFeatures) {
      try {
        if (geoContains(sf, [lon, lat])) {
          stateId = sf.properties.id
          break
        }
      } catch {
        // ignore malformed geometry
      }
    }
    if (!stateId) {
      // fallback: nearest state centroid
      let best = null
      let bestDist = Infinity
      for (const sf of simplifiedFeatures) {
        const d = (sf.centroid[0] - lon) ** 2 + (sf.centroid[1] - lat) ** 2
        if (d < bestDist) {
          bestDist = d
          best = sf.properties.id
        }
      }
      stateId = best
    }
    return {
      id: String(c.properties.NAME + '-' + Math.round(lat * 100) + '-' + Math.round(lon * 100)),
      name: c.properties.NAME,
      lat: round(lat),
      lon: round(lon),
      pop: c.properties.POP_MAX || 0,
      stateId,
    }
  })
  if (cityEntries.length) {
    fs.writeFileSync(path.join(OUT_CITIES, `${numericId}.json`), JSON.stringify(cityEntries))
    geoIndex.hasCities.push(numericId)
  }
  countriesProcessed++
}

// Countries with cities but no state subdivisions: still write a cities file (no stateId use)
for (const [alpha3, cities] of citiesByCountry) {
  const numericId = alpha3ToNumeric.get(alpha3)
  if (!numericId) continue
  if (statesByCountry.has(alpha3)) continue // already handled above
  const cityEntries = cities.map((c) => ({
    id: String(c.properties.NAME + '-' + Math.round(c.properties.LATITUDE * 100) + '-' + Math.round(c.properties.LONGITUDE * 100)),
    name: c.properties.NAME,
    lat: round(c.properties.LATITUDE),
    lon: round(c.properties.LONGITUDE),
    pop: c.properties.POP_MAX || 0,
    stateId: null,
  }))
  fs.writeFileSync(path.join(OUT_CITIES, `${numericId}.json`), JSON.stringify(cityEntries))
  geoIndex.hasCities.push(numericId)
}

fs.writeFileSync(path.resolve('src/data/geo-index.json'), JSON.stringify(geoIndex))

console.log('Countries with states:', geoIndex.hasStates.length)
console.log('Countries with cities:', geoIndex.hasCities.length)
console.log('Simplifications rejected as broken (used raw geometry instead):', brokenSimplifications)
console.log('Done.')

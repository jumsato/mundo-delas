import { geoMercator } from 'd3-geo'
import type { GeoProjection } from 'd3-geo'
import type { FeatureCollection } from 'geojson'

export const MAP_WIDTH = 800
export const MAP_HEIGHT = 600

export function fitProjection(featureCollection: FeatureCollection): GeoProjection {
  const projection = geoMercator()
  projection.fitExtent(
    [
      [20, 20],
      [MAP_WIDTH - 20, MAP_HEIGHT - 20],
    ],
    featureCollection,
  )
  return projection
}

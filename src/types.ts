/**
 * Named geographic point.
 * @description Holds a location name and coordinates.
 */
export interface TerrestrialLocation {
  /** Latitude in degrees */
  latitude: number
  /** Longitude in degrees */
  longitude: number
  /** Location display name */
  name: string
}

/**
 * Distance calculation input.
 * @description Origin, targets, and output unit.
 */
export interface TerrestrialParams {
  /** Locations measured from origin */
  targets: TerrestrialLocation[]
  /** Starting location for distances */
  origin: TerrestrialLocation
  /** Distance unit km m or mi */
  unit: 'km' | 'm' | 'mi'
}

/**
 * Reduced latitude projection.
 * @description Sine and cosine of reduced latitude.
 */
export interface TerrestrialProject {
  /** Reduced latitude cosine */
  cosine: number
  /** Reduced latitude sine */
  sine: number
}

/**
 * Location with measured distance.
 * @description Target location plus distance from origin.
 */
export interface TerrestrialResult extends TerrestrialLocation {
  /** Distance in the requested unit */
  distance: number
}

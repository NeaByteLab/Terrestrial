import type * as Types from '@app/types.ts'

/**
 * WGS84 geodesic distance calculator.
 * @description Measures each target and sorts nearest first.
 */
export default class Terrestrial {
  /** WGS84 ellipsoidal flattening ratio */
  static readonly flattening = 1 / 298.257223563
  /** WGS84 equatorial radius in meters */
  static readonly equator = 6378137.0

  /**
   * Measure distances from origin.
   * @description Returns each target sorted by nearest distance.
   * @param params - Origin targets and unit
   * @returns Target locations with distances
   * @throws TypeError When a value has the wrong type
   * @throws RangeError When a coordinate is outside range
   */
  static calculate(params: Types.TerrestrialParams): Types.TerrestrialResult[] {
    if (typeof params !== 'object' || params === null) {
      throw new TypeError('params must be an object')
    }
    const { origin, targets, unit } = params
    if (typeof origin !== 'object' || origin === null) {
      throw new TypeError('origin must be an object')
    }
    if (typeof origin.name !== 'string') {
      throw new TypeError('origin name must be a string')
    }
    if (typeof origin.latitude !== 'number' || !Number.isFinite(origin.latitude)) {
      throw new TypeError('origin latitude must be a finite number')
    }
    if (origin.latitude < -90 || origin.latitude > 90) {
      throw new RangeError('origin latitude is out of range')
    }
    if (typeof origin.longitude !== 'number' || !Number.isFinite(origin.longitude)) {
      throw new TypeError('origin longitude must be a finite number')
    }
    if (origin.longitude < -180 || origin.longitude > 180) {
      throw new RangeError('origin longitude is out of range')
    }
    if (!Array.isArray(targets)) {
      throw new TypeError('targets must be an array')
    }
    if (unit !== 'km' && unit !== 'm' && unit !== 'mi') {
      throw new TypeError('unit must be km, m, or mi')
    }
    const projected = Terrestrial.project(origin.latitude)
    const scale = (unit === 'km' ? 0.001 : unit === 'mi' ? 0.000621371192237334 : 1) *
      2 *
      Terrestrial.equator
    const results: Types.TerrestrialResult[] = new Array(targets.length)
    for (let index = 0; index < targets.length; index++) {
      const location = targets[index]
      if (typeof location !== 'object' || location === null) {
        throw new TypeError(`targets ${index} must be an object`)
      }
      if (typeof location.name !== 'string') {
        throw new TypeError(`targets ${index} name must be a string`)
      }
      if (typeof location.latitude !== 'number' || !Number.isFinite(location.latitude)) {
        throw new TypeError(`targets ${index} latitude must be a finite number`)
      }
      if (location.latitude < -90 || location.latitude > 90) {
        throw new RangeError(`targets ${index} latitude is out of range`)
      }
      if (typeof location.longitude !== 'number' || !Number.isFinite(location.longitude)) {
        throw new TypeError(`targets ${index} longitude must be a finite number`)
      }
      if (location.longitude < -180 || location.longitude > 180) {
        throw new RangeError(`targets ${index} longitude is out of range`)
      }
      const target = Terrestrial.project(location.latitude)
      const ratio = (location.longitude - origin.longitude) * 0.002777777777777778
      const square = ((ratio - (((ratio + 1.5) | 0) - 1)) * 2) ** 2
      const haversine = square *
        (2.4674010776942628 +
          square *
            (-2.0293544366331746 +
              square *
                (0.6676123501454402 +
                  square *
                    (-0.11758359199012257 +
                      square * (0.01274394159153217 - square * 0.0008193624628583029)))))
      const sineGap = target.sine - projected.sine
      const cosineGap = target.cosine - projected.cosine
      const chord = 0.25 * (sineGap * sineGap + cosineGap * cosineGap) +
        projected.cosine * target.cosine * haversine
      const complement = 1 - chord
      const apothem = Math.sqrt(complement)
      const sagitta = 1 - apothem
      const arc = 1 +
        (sagitta *
            (0.3333333336353243 +
              sagitta * (-0.11887084352073178 + sagitta * 0.0009117950550094487))) /
          (1 + sagitta * (-0.7566116085218106 + sagitta * 0.1339356363629366))
      const rectified = chord -
        (0.25 *
            Terrestrial.flattening *
            (chord * (arc - apothem) * (target.sine + projected.sine) ** 2 +
              (1 - 0.5 * Terrestrial.flattening) * complement * (arc + apothem) * sineGap *
                sineGap)) /
          (arc * complement)
      results[index] = {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        distance: Math.sqrt(rectified) * arc * scale
      }
    }
    return results.sort((left, right) => left.distance - right.distance)
  }

  /**
   * Project reduced latitude factors.
   * @description Builds sine and cosine from latitude.
   * @param latitude - Latitude in degrees
   * @returns Reduced sine and cosine
   * @throws TypeError When latitude is not finite
   * @throws RangeError When latitude is outside range
   */
  private static project(latitude: number): Types.TerrestrialProject {
    if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
      throw new TypeError('latitude must be a finite number')
    }
    if (latitude < -90 || latitude > 90) {
      throw new RangeError('latitude is out of range')
    }
    const reduced = latitude * 0.011111111111111112
    const squared = reduced * reduced
    return {
      cosine: (1 - squared) *
        (1.0000001978968076 +
          squared *
            (-0.22545159055155203 +
              squared *
                (0.011427976641590858 +
                  squared * (0.002678000585756832 - squared * 0.0006144593519783027)))),
      sine: reduced *
        (1.565530337819257 +
          squared *
            (-0.6308985447230583 +
              squared *
                (0.06387440267708996 +
                  squared * (0.0028502383391022295 - squared * 0.0013569736297307255))))
    }
  }
}

/** Re-export public location types */
export type * from '@app/types.ts'

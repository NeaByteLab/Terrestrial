import * as Assert from '@std/assert'
import Terrestrial from '@app/index.ts'
import type * as Types from '@app/types.ts'

const origin: Types.TerrestrialLocation = { latitude: 0, longitude: 0, name: 'Null Island' }

const point = (
  name: string,
  latitude: number,
  longitude: number
): Types.TerrestrialLocation => ({ latitude, longitude, name })

const params = (
  targets: Types.TerrestrialLocation[],
  unit: Types.TerrestrialParams['unit'] = 'm',
  start: Types.TerrestrialLocation = origin
): Types.TerrestrialParams => ({ origin: start, targets, unit })

const vincenty = (
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number
): number => {
  const equator = 6378137
  const flattening = 1 / 298.257223563
  const polar = (1 - flattening) * equator
  const first = Math.atan((1 - flattening) * Math.tan(firstLatitude * Math.PI / 180))
  const second = Math.atan((1 - flattening) * Math.tan(secondLatitude * Math.PI / 180))
  const originSine = Math.sin(first)
  const originCosine = Math.cos(first)
  const targetSine = Math.sin(second)
  const targetCosine = Math.cos(second)
  const difference = (secondLongitude - firstLongitude) * Math.PI / 180
  let lambda = difference
  let sigmaSine = 0
  let sigmaCosine = 0
  let sigma = 0
  let alphaSine = 0
  let alphaSquare = 0
  let midpoint = 0
  for (let index = 0; index < 200; index++) {
    const lambdaSine = Math.sin(lambda)
    const lambdaCosine = Math.cos(lambda)
    sigmaSine = Math.sqrt(
      (targetCosine * lambdaSine) ** 2 +
        (originCosine * targetSine - originSine * targetCosine * lambdaCosine) ** 2
    )
    if (sigmaSine === 0) {
      return 0
    }
    sigmaCosine = originSine * targetSine + originCosine * targetCosine * lambdaCosine
    sigma = Math.atan2(sigmaSine, sigmaCosine)
    alphaSine = originCosine * targetCosine * lambdaSine / sigmaSine
    alphaSquare = 1 - alphaSine * alphaSine
    midpoint = alphaSquare === 0 ? 0 : sigmaCosine - 2 * originSine * targetSine / alphaSquare
    const correction = flattening / 16 * alphaSquare * (2 + flattening * (4 - 3 * alphaSquare))
    const previous = lambda
    lambda = difference +
      (1 - correction) * flattening * alphaSine *
        (sigma +
          correction * sigmaSine *
            (midpoint + correction * sigmaCosine * (-1 + 2 * midpoint * midpoint)))
    if (Math.abs(lambda - previous) < 1e-12) {
      break
    }
  }
  const reduced = alphaSquare * (equator * equator - polar * polar) / (polar * polar)
  const series = 1 + reduced / 16384 * (4096 + reduced * (-768 + reduced * (320 - 175 * reduced)))
  const factor = reduced / 1024 * (256 + reduced * (-128 + reduced * (74 - 47 * reduced)))
  return polar * series *
    (sigma -
      factor * sigmaSine *
        (midpoint +
          factor / 4 *
            (sigmaCosine * (-1 + 2 * midpoint * midpoint) -
              factor / 6 * midpoint * (-3 + 4 * sigmaSine * sigmaSine) *
                (-3 + 4 * midpoint * midpoint))))
}

Deno.test('Terrestrial.calculate - accepts coordinate range limits', () => {
  const result = Terrestrial.calculate(params(
    [point('Corner', 90, 180)],
    'm',
    point('Origin', -90, -180)
  ))
  Assert.assertEquals(result.length, 1)
  Assert.assertEquals(Number.isFinite(result[0]?.distance), true)
})
Deno.test('Terrestrial.calculate - keeps location fields and reports a finite distance', () => {
  const result = Terrestrial.calculate(params([point('Accra', 5.6037, -0.187)]))
  Assert.assertEquals(result[0]?.name, 'Accra')
  Assert.assertEquals(result[0]?.latitude, 5.6037)
  Assert.assertEquals(result[0]?.longitude, -0.187)
  Assert.assertEquals(Number.isFinite(result[0]?.distance), true)
})
Deno.test('Terrestrial.calculate - returns an empty array for empty targets', () => {
  Assert.assertEquals(Terrestrial.calculate(params([])), [])
})
Deno.test('Terrestrial.calculate - returns the readme sample in kilometers', () => {
  const result = Terrestrial.calculate({
    origin: point('Jakarta', -6.2088, 106.8456),
    targets: [
      point('Tokyo', 35.6762, 139.6503),
      point('Bandung', -6.9175, 107.6191),
      point('Singapore', 1.3521, 103.8198)
    ],
    unit: 'km'
  })
  Assert.assertEquals(result.map((item) => item.name), ['Bandung', 'Singapore', 'Tokyo'])
  Assert.assertAlmostEquals(result[0]?.distance ?? 0, 116.01893724782411, 1e-9)
  Assert.assertAlmostEquals(result[1]?.distance ?? 0, 901.1652600342751, 1e-9)
  Assert.assertAlmostEquals(result[2]?.distance ?? 0, 5767.690861436552, 1e-9)
})
Deno.test('Terrestrial.calculate - returns zero for the same point', () => {
  const result = Terrestrial.calculate(params([origin]))
  Assert.assertAlmostEquals(result[0]?.distance ?? 1, 0, 1e-6)
})
Deno.test('Terrestrial.calculate - scales meters into kilometers and miles', () => {
  const target = point('Quito', -0.1807, -78.4678)
  const meters = Terrestrial.calculate(params([target], 'm'))[0]?.distance ?? 0
  const kilometers = Terrestrial.calculate(params([target], 'km'))[0]?.distance ?? 0
  const miles = Terrestrial.calculate(params([target], 'mi'))[0]?.distance ?? 0
  Assert.assertAlmostEquals(kilometers, meters * 0.001, 1e-9)
  Assert.assertAlmostEquals(miles, meters * 0.000621371192237334, 1e-9)
})
Deno.test('Terrestrial.calculate - sorts targets from nearest to farthest', () => {
  const result = Terrestrial.calculate(params([
    point('Far', 40, 40),
    point('Near', 1, 1),
    point('Mid', 10, -10)
  ]))
  const distances = result.map((item) => item.distance)
  Assert.assertEquals(result.map((item) => item.name), ['Near', 'Mid', 'Far'])
  Assert.assertEquals(distances, [...distances].sort((left, right) => left - right))
})
Deno.test('Terrestrial.calculate - stays within published null island error', () => {
  const locations = JSON.parse(
    Deno.readTextFileSync(new URL('../location.json', import.meta.url))
  ) as {
    lat: number
    long: number
    name: string
  }[]
  const result = Terrestrial.calculate(params(
    locations.map((item) => point(item.name, item.lat, item.long))
  ))
  const errors = result.map((item) =>
    Math.abs(item.distance - vincenty(0, 0, item.latitude, item.longitude))
  ).sort((left, right) => left - right)
  Assert.assertEquals(result.length, 249)
  Assert.assertAlmostEquals(errors[Math.floor(errors.length / 2)] ?? 0, 1.001, 0.001)
  Assert.assertEquals((errors.at(-1) ?? 0) < 358, true)
})
Deno.test('Terrestrial.calculate - throws when a target is not an object', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([null as never])),
    TypeError,
    'targets 0 must be an object'
  )
})
Deno.test('Terrestrial.calculate - throws when a target latitude is out of range', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([point('Bad', -91, 0)])),
    RangeError,
    'targets 0 latitude is out of range'
  )
})
Deno.test('Terrestrial.calculate - throws when a target longitude is not finite', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([point('Bad', 0, Number.NaN)])),
    TypeError,
    'targets 0 longitude must be a finite number'
  )
})
Deno.test('Terrestrial.calculate - throws when a target name is not a string', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([{ latitude: 1, longitude: 1, name: 2 as never }])),
    TypeError,
    'targets 0 name must be a string'
  )
})
Deno.test('Terrestrial.calculate - throws when origin is missing', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate({ targets: [], unit: 'km' } as never),
    TypeError,
    'origin must be an object'
  )
})
Deno.test('Terrestrial.calculate - throws when origin latitude is not finite', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([], 'km', point('Bad', Number.NaN, 0))),
    TypeError,
    'origin latitude must be a finite number'
  )
})
Deno.test('Terrestrial.calculate - throws when origin latitude is out of range', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([], 'km', point('Bad', 90.1, 0))),
    RangeError,
    'origin latitude is out of range'
  )
})
Deno.test('Terrestrial.calculate - throws when origin longitude is not finite', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([], 'km', point('Bad', 0, Number.POSITIVE_INFINITY))),
    TypeError,
    'origin longitude must be a finite number'
  )
})
Deno.test('Terrestrial.calculate - throws when origin longitude is out of range', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([], 'km', point('Bad', 0, -180.1))),
    RangeError,
    'origin longitude is out of range'
  )
})
Deno.test('Terrestrial.calculate - throws when origin name is not a string', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(params([], 'km', { latitude: 0, longitude: 0, name: 1 as never })),
    TypeError,
    'origin name must be a string'
  )
})
Deno.test('Terrestrial.calculate - throws when params is not an object', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate(null as never),
    TypeError,
    'params must be an object'
  )
})
Deno.test('Terrestrial.calculate - throws when targets is not an array', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate({ origin, targets: {}, unit: 'm' } as never),
    TypeError,
    'targets must be an array'
  )
})
Deno.test('Terrestrial.calculate - throws when unit is invalid', () => {
  Assert.assertThrows(
    () => Terrestrial.calculate({ origin, targets: [], unit: 'ft' } as never),
    TypeError,
    'unit must be km, m, or mi'
  )
})
Deno.test('Terrestrial.calculate - wraps longitude across the antimeridian', () => {
  const west = Terrestrial.calculate(params([point('West', 0, -179)], 'm'))[0]?.distance ?? 0
  const east = Terrestrial.calculate(params([point('East', 0, 179)], 'm'))[0]?.distance ?? 0
  Assert.assertAlmostEquals(west, east, 1e-4)
})
Deno.test('Terrestrial.flattening - exposes the WGS84 flattening ratio', () => {
  Assert.assertEquals(Terrestrial.flattening, 1 / 298.257223563)
})
Deno.test('Terrestrial.equator - exposes the WGS84 equatorial radius', () => {
  Assert.assertEquals(Terrestrial.equator, 6378137)
})

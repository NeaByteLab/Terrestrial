<div align='center'>

<img src="./assets/preview.webp" alt="Terrestrial Preview" width="100%">

[![Deno](https://img.shields.io/badge/deno-compatible-ffcb00?logo=deno&logoColor=000000)](https://deno.com) [![Node](https://img.shields.io/badge/node-%3E%3D24-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org) [![Bun](https://img.shields.io/badge/bun-compatible-f9f1e1?logo=bun&logoColor=000000)](https://bun.sh) [![Browser](https://img.shields.io/badge/browser-compatible-4285F4?logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

## What is Terrestrial?

Terrestrial is a zero-trigonometry WGS84 ellipsoidal geodesic distance engine that projects reduced latitudes and longitudinal chords through algebraic Horner polynomials, Alexandrian apothem-sagitta rectification, and bitwise antimeridian wrapping, returning target locations sorted from nearest to farthest.

## Installation

**Deno:**

```bash
deno add npm:@neabyte/terrestrial
```

**npm:**

```bash
npm install @neabyte/terrestrial
```

**CDN (jsDelivr/esm.sh):**

```html
<script type="module">
import Terrestrial from 'https://cdn.jsdelivr.net/npm/@neabyte/terrestrial/dist/index.mjs'
</script>
```

Or via [esm.sh](https://esm.sh):

```html
<script type="module">
import Terrestrial from 'https://esm.sh/@neabyte/terrestrial'
</script>
```

## Usage

```ts
import Terrestrial from '@neabyte/terrestrial'

// Nearest targets come back first
const result = Terrestrial.calculate({
  origin: {
    name: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456
  },
  targets: [
    {
      name: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503
    },
    {
      name: 'Bandung',
      latitude: -6.9175,
      longitude: 107.6191
    },
    {
      name: 'Singapore',
      latitude: 1.3521,
      longitude: 103.8198
    }
  ],
  unit: 'km'
})

console.log(result)
// [
//   {
//     name: 'Bandung',
//     latitude: -6.9175,
//     longitude: 107.6191,
//     distance: 116.01894...
//   },
//   {
//     name: 'Singapore',
//     latitude: 1.3521,
//     longitude: 103.8198,
//     distance: 901.16526...
//   },
//   {
//     name: 'Tokyo',
//     latitude: 35.6762,
//     longitude: 139.6503,
//     distance: 5767.69086...
//   }
// ]
```

`targets` with an empty array returns `[]`, and invalid coordinates or units throw a `TypeError` or `RangeError`.

## API

### `Terrestrial.calculate(params)`

| Parameter        | Type                    | Description                                                                        |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `params.origin`  | `TerrestrialLocation`   | Origin location (`name`, `latitude` in `[-90, 90]`, `longitude` in `[-180, 180]`). |
| `params.targets` | `TerrestrialLocation[]` | Target locations to measure against `origin`.                                      |
| `params.unit`    | `'km' \| 'm' \| 'mi'`   | Output distance unit (kilometers, meters, or miles).                               |

**Returns:** `TerrestrialResult[]`, sorted by ascending `distance` (nearest first).

```ts
interface TerrestrialLocation {
  latitude: number
  longitude: number
  name: string
}

interface TerrestrialParams {
  targets: TerrestrialLocation[]
  origin: TerrestrialLocation
  unit: 'km' | 'm' | 'mi'
}

interface TerrestrialProject {
  cosine: number
  sine: number
}

interface TerrestrialResult extends TerrestrialLocation {
  distance: number
}
```

### Static Constants

| Property                 | Value               | Description                         |
| ------------------------ | ------------------- | ----------------------------------- |
| `Terrestrial.equator`    | `6378137.0`         | WGS84 equatorial radius in meters.  |
| `Terrestrial.flattening` | `1 / 298.257223563` | WGS84 ellipsoidal flattening ratio. |

## Accuracy

Distances from Null Island (`0°`, `0°`) to 249 ISO 3166-1 locations, measured in meters and compared with Vincenty on the WGS84 ellipsoid.

| Metric          | Error                            |
| --------------- | -------------------------------- |
| Median          | 1.001 m                          |
| Mean            | 11.267 m                         |
| 95th percentile | 72.019 m                         |
| Maximum         | +357.838 m (Tokelau, 19.177 ppm) |

Short and mid-range routes stay near a meter, while the larger gaps show up on antipodal Pacific routes of about 17,000 to 19,000 km. The full country table is in [ACCURACY.md](./ACCURACY.md).

## Build

```bash
npm run build
```

## Testing

```bash
deno task check
```

```bash
deno task test
```

## License

This repository is licensed under [Apache 2.0](./LICENSE).

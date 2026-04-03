---
title: City Geolocation
description: IP-to-city geolocation using RFC 8805 geofeeds, compiled into city.mmdb with full geographic metadata.
icon: i-lucide-map-pin
---

The City source maps IP prefixes to city-level geographic data using [RFC 8805](https://datatracker.ietf.org/doc/html/rfc8805) validated geofeeds enriched with a comprehensive country and city hierarchy. Records include city, state, country, coordinates, timezone, currency, and calling code.

**Output file:** `city.mmdb`

---

## Data Sources

- Validated geofeed CSV: [geolocatemuch.com/geofeeds/validated-all.csv](https://geolocatemuch.com/geofeeds/validated-all.csv)
- Country and city hierarchy: bundled `countries+states+cities.json`

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --city
```

```bash [yarn]
yarn dlx @riavzon/shield-base --city
```

```bash [npm]
npx @riavzon/shield-base --city
```

```bash [bun]
bunx @riavzon/shield-base --city
```
```ts [Programmatic]
import { buildCitiesData } from '@riavzon/shield-base';

await buildCitiesData('./out', 'mmdbctl');
```
::

---

## Record Structure

```ts
interface CityGeoRecord {
  range: string;
  country_code: string;   // ISO 3166-1 alpha-2, e.g. "FR"
  region: string;         // Region code, e.g. "FR-75C"
  city: string;
  zip_code: string;
  numericCode: string;    // ISO 3166-1 numeric, e.g. "250"
  latitude: string;
  longitude: string;
  state: string;
  name: string;           // Country name
  native: string;         // Native country name
  phone: string;          // International calling code
  continent: string;
  capital: string;
  currency: string;
  currency_name: string;
  iso639: string;         // Primary language code
  languages: string;
  emoji: string;          // Country flag emoji
  timezone: string;       // IANA timezone identifier
  utc_offset: string;
  tld: string;
  nationality: string;
  subregion: string;
  timeZoneName: string;
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 137.174.48.5 outputDirectory/city.mmdb
```

```json
{
"capital": "Paris",
"city": "Paris",
"continent": "Europe",
"country_code": "FR",
"currency": "EUR",
"currency_name": "Euro",
"emoji": "🇫🇷",
"ip": "137.174.48.5",
"languages": "Frañs",
"latitude": "48.85661400",
"longitude": "2.35222190",
"name": "France",
"nationality": "French",
"native": "France",
"network": "137.174.48.0/21",
"numericCode": "250",
"phone": "33",
"region": "FR-75C",
"state": "Paris",
"subregion": "Western Europe",
"timeZoneName": "Central European Time",
"timezone": "Europe/Paris",
"tld": ".fr",
"utc_offset": "UTC+01:00",
"zip_code": "123456"
}
```

::note
For country-level lookups without city detail, use the [Country](/docs/shield-base/data-sources/country) source instead.
::

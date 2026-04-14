---
title: Country Geolocation
description: IP-to-country mapping derived from RIR databases and WHOIS records, compiled into country.mmdb.
icon: i-lucide-globe
---

The Country source maps IP prefixes to country-level geographic data. Records include country name, ISO codes, currency, calling code, subregion, and timezone. Data is derived from RIR databases (AFRINIC, APNIC, ARIN, LACNIC, RIPE NCC) and WHOIS records, enriched with country metadata.

**Output file:** `country.mmdb`

---

## Data Sources

- IPv4-to-country CSV: [github.com/sapics/ip-location-db](https://raw.githubusercontent.com/sapics/ip-location-db/refs/heads/main/geo-asn-country/geo-asn-country-ipv4.csv)
- Country metadata: bundled `countries+states+cities.json`

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --geo
```

```bash [yarn]
yarn dlx @riavzon/shield-base --geo
```

```bash [npm]
npx @riavzon/shield-base --geo
```

```bash [bun]
bunx @riavzon/shield-base --geo
```
```ts [Programmatic]
import { getGeoDatas } from '@riavzon/shield-base';

await getGeoDatas('./out', 'mmdbctl');
```
::

---

## Record Structure

```ts
interface GeoRecord {
  range: string;
  country_code: string;    // ISO 3166-1 alpha-2, e.g. "US"
  region: string;          // Continental region, e.g. "Americas"
  numericCode: string;     // ISO 3166-1 numeric, e.g. "840"
  name: string;
  native: string;
  phone: string;           // International calling code
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  iso639: string;          // Primary language code
  languages: string;
  emoji: string;           // Country flag emoji
  tld: string;
  nationality: string;
  subregion: string;       // e.g. "Northern America"
  timezone: string;        // IANA timezone identifier
  timeZoneName: string;
  utc_offset: string;
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 161.185.160.93 outputDirectory/country.mmdb
```

```json
{
  "capital": "Washington",
  "country_code": "US",
  "currency": "USD",
  "currency_name": "United States dollar",
  "currency_symbol": "$",
  "emoji": "🇺🇸",
  "ip": "161.185.160.93",
  "languages": "Stadoù-Unanet",
  "name": "United States",
  "nationality": "American",
  "native": "United States",
  "network": "161.185.0.0-161.186.255.255",
  "numericCode": "840",
  "phone": "1",
  "region": "Americas",
  "subregion": "Northern America",
  "timeZoneName": "Hawaii–Aleutian Standard Time",
  "timezone": "America/Adak",
  "tld": ".us",
  "utc_offset": "UTC-10:00"
}
```

::note
For city-level detail including coordinates and postal codes, use the [City](/docs/shield-base/data-sources/city) source instead.
::

---
title: Verified Crawlers
description: IP ranges for major search engine and platform crawlers fetched from official provider geofeeds, compiled into goodBots.mmdb.
icon: i-lucide-search
---

The Crawlers source fetches IP ranges for major search engine crawlers and legitimate automated agents from their official geofeeds and documentation pages. Data is extracted from JSON, CSV, and HTML sources, then merged and compiled into a single MMDB database.

The fetcher uses a tiered fetch with a fallback mechanism that invokes `curl` to bypass anti-scraping measures on social media geofeeds when it detects a regular fetch being blocked.

**Output file:** `goodBots.mmdb`

::warning
Make sure `curl` is installed on your system when using this data source. The fallback mechanism requires it to fetch certain provider pages.
::

---

## Built-in Providers

| Provider | Type | Source |
| --- | --- | --- |
| Google | JSON | [googlebot.json](https://developers.google.com/static/search/apis/ipranges/googlebot.json), [special-crawlers.json](https://developers.google.com/static/search/apis/ipranges/special-crawlers.json), [user-triggered-fetchers.json](https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json), [user-triggered-fetchers-google.json](https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json), [goog.json](https://www.gstatic.com/ipranges/goog.json) |
| Bing | JSON | [bingbot.json](https://www.bing.com/toolbox/bingbot.json) |
| OpenAI | JSON | [gptbot.json](https://openai.com/gptbot.json), [searchbot.json](https://openai.com/searchbot.json) |
| Apple | JSON | [applebot.json](https://search.developer.apple.com/applebot.json) |
| Ahrefs | JSON | [crawler-ip-ranges](https://api.ahrefs.com/v3/public/crawler-ip-ranges) |
| DuckDuckGo | HTML | [duckassistbot](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot), [duckduckbot](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot) |
| Common Crawl | HTML | [commoncrawl.org/faq](https://commoncrawl.org/faq) |
| X / Twitter | HTML | [troubleshooting-cards](https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards) |
| Facebook | CSV | [facebook.com/peering/geofeed](https://www.facebook.com/peering/geofeed) |
| Pinterest | HTML | [pinterestbot](https://help.pinterest.com/en/business/article/pinterestbot) |
| Telegram | HTML | [bots/webhooks](https://core.telegram.org/bots/webhooks) |
| Semrush | HTML | [semrush.com/kb/1149](https://www.semrush.com/kb/1149-issues-with-crawling-a-domain) |

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --seo
```

```bash [yarn]
yarn dlx @riavzon/shield-base --seo
```

```bash [npm]
npx @riavzon/shield-base --seo
```

```bash [bun]
bunx @riavzon/shield-base --seo
```
```ts [Programmatic]
import { getCrawlersIps } from '@riavzon/shield-base';

// Compile with built-in providers only
await getCrawlersIps('./out', 'mmdbctl');

// Or merge custom providers with built-in ones
import type { ProvidersLists } from '@riavzon/shield-base';

const customProviders: ProvidersLists[] = [
  {
    name: 'cloudflare',
    type: 'JSON',
    urls: [
      'https://www.cloudflare.com/ips-v4',
      'https://www.cloudflare.com/ips-v6',
    ],
  },
];

await getCrawlersIps('./out', 'mmdbctl', customProviders);
```
::

::note
When custom providers are passed, they are merged with the built-in datasets and compiled into a single `goodBots.mmdb` database.
::

---

## Record Structure

```ts
interface CrawlersRecord {
  range: string;        // IP prefix, e.g. "66.249.66.0/24"
  provider: string;     // Provider name, e.g. "google", "bing", "apple"
  syncToken: string;    // Provider sync token (when available)
  creationTime: string; // Provider creation timestamp
}

interface ProvidersLists {
  name: string;                    // Stored as the `provider` field in the database
  type: 'HTML' | 'JSON' | 'CSV';  // Format of the source URL
  urls: string[];                  // One or more URLs to fetch
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 66.249.66.1 outputDirectory/goodBots.mmdb
```

```json
{
  "provider": "google",
  "range": "66.249.66.0/24",
  "syncToken": "1710000000",
  "creationTime": "2024-03-09T22:00:00.000Z"
}
```
::caution
The type field is a special field that the success of the data retrieval depends on.
  If the links you are providing include a regular html/markdown/other-raw-text-data page, use HTML. If it is a link to a CSV file, use CSV.
  If it is a JSON (e.g., https://developers.google.com/static/search/apis/ipranges/googlebot.json), use JSON.
  Providing urls that mixes CSV with JSON data or raw text with CSV and JSON will fail to process this provider.
  Visit the built-in providers to get an idea of the parsing engine or check the [source code](https://github.com/Sergo706/shield-base-cli/tree/main/src/scripts/goodBotsScrapper).
::
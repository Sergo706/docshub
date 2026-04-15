import type { NitroApp } from 'nitropack';
import type { FeedItem, ContentItemWrapper, FeedEnclosure } from 'nitropack';

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const baseUrl = (process.env.BASE_URL ?? 'https://docs.riavzon.com').replace(/\/$/, '');

  const toAbsolute = (url: unknown): unknown => {
    if (typeof url !== 'string' || !url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return baseUrl + url;
    return url;
  };

  const resolveMime = (url: string): string => {
    const clean = (url.split('?')[0] ?? url).toLowerCase();
    if (clean.endsWith('.png')) return 'image/png';
    if (clean.endsWith('.webp')) return 'image/webp';
    if (clean.endsWith('.gif')) return 'image/gif';
    if (clean.endsWith('.svg')) return 'image/svg+xml';
    if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
    if (clean.includes('unsplash.com') || clean.includes('images.unsplash.com')) return 'image/jpeg';
    return 'image/jpeg';
  };

  const ensureImageExtension = (url: string, ext = '.jpg'): string => {
    try {
      const u = new URL(url);
      if (/\.[a-z0-9]+$/i.test(u.pathname)) return url;
      u.pathname = u.pathname.replace(/\/$/, '') + ext;
      return u.toString();
    } catch {
      return url.endsWith(ext) ? url : url + ext;
    }
  };

  const FALLBACK_LENGTH = 1024 * 1024;

  const createEnclosureFromString = (src: string): FeedEnclosure => {
    const abs = toAbsolute(src);
    const absStr = typeof abs === 'string' ? abs : src;
    const absWithExt = ensureImageExtension(absStr, '.jpeg');
    return {
      url: absWithExt,
      length: FALLBACK_LENGTH,
      type: resolveMime(absWithExt),
    };
  };

  const normalizeObjectMedia = (obj: unknown) => {
    if (obj == null || typeof obj !== 'object') return null;
    const map = obj as Record<string, unknown>;

    const rawUrl =
      (typeof map.url === 'string' && map.url) ||
      (typeof map.src === 'string' && map.src) ||
      (typeof map.path === 'string' && map.path) ||
      (typeof map.href === 'string' && map.href) ||
      undefined;

    if (typeof rawUrl !== 'string') return null;

    const abs = toAbsolute(rawUrl);
    const absStr = typeof abs === 'string' ? abs : rawUrl;
    const absWithExt = ensureImageExtension(absStr, '.jpeg');

    let type = typeof map.type === 'string' ? map.type : undefined;
    type ??= resolveMime(absWithExt);

    let length = typeof map.length === 'number' && Number.isFinite(map.length) ? map.length : undefined;
    length ??= FALLBACK_LENGTH;

    return { url: absWithExt, type, length } as { url: string; type: string; length: number };
  };

  const normalizeItem = (opts: { item: ContentItemWrapper<FeedItem> }): void => {
    const wrapper = opts.item;
    const item = wrapper.get();

    const linkAbs = toAbsolute(item.link);
    if (typeof linkAbs === 'string') item.link = linkAbs;
    if (item.link) item.guid = item.link;


    if (item.enclosure) {
      if (typeof item.enclosure === 'string') {
        item.enclosure = createEnclosureFromString(item.enclosure);
      } else {
        const normalized = normalizeObjectMedia(item.enclosure);
        if (normalized) item.enclosure = normalized;
      }
    }

    if (!item.enclosure && item.image) {
      if (typeof item.image === 'string') {
        item.enclosure = createEnclosureFromString(item.image);
      } else {
        const normalized = normalizeObjectMedia(item.image);
        if (normalized) item.enclosure = normalized;
      }
    }


    if (!item.image && item.enclosure) {
      const encl = item.enclosure as FeedEnclosure;
      item.image = { url: encl.url, type: encl.type, length: encl.length };
    } else if (typeof item.image === 'string') {
      if (item.enclosure) {
        const encl = item.enclosure as FeedEnclosure;
        item.image = { url: encl.url, type: encl.type, length: encl.length };
      } else {
        item.image = createEnclosureFromString(item.image);
      }
    } else if (typeof item.image === 'object') {
      const normalized = normalizeObjectMedia(item.image);
      if (normalized) item.image = normalized;
    }

    wrapper.set(item);
  };

  nitroApp.hooks.hook('feedme:handle:content:item', normalizeItem);
  nitroApp.hooks.hook('feedme:handle:content:item[/feed.xml]', normalizeItem);
  nitroApp.hooks.hook('feedme:handle:content:item[/feed.atom]', normalizeItem);
  nitroApp.hooks.hook('feedme:handle:content:item[/feed.json]', normalizeItem);
});

import 'nitropack';

declare module 'nitropack' {
  export interface FeedEnclosure {
    url: string;
    type?: string;
    length?: number;
    [key: string]: unknown;
  }

  export interface FeedItem {
    link?: string;
    guid?: string;
    enclosure?: FeedEnclosure | string | null;
    image?: FeedEnclosure | string | null | Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface ContentItemWrapper<T = unknown> {
    get(): T;
    set(item: T): void;
  }

  export interface FeedmeItemOpts {
    item: ContentItemWrapper<FeedItem>;
  }


  interface NitroRuntimeHooks {
    'feedme:handle:content:item': (opts: FeedmeItemOpts) => void | Promise<void>;
    'feedme:handle:content:item[/feed.xml]': (opts: FeedmeItemOpts) => void | Promise<void>;
    'feedme:handle:content:item[/feed.atom]': (opts: FeedmeItemOpts) => void | Promise<void>;
    'feedme:handle:content:item[/feed.json]': (opts: FeedmeItemOpts) => void | Promise<void>;
  }
}

export {};

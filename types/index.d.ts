type FastUri = typeof fastUri

declare namespace fastUri {
  export interface URIComponent {
    scheme?: string;
    userinfo?: string;
    host?: string;
    /**
     * Internal, non-enumerable round-trippable form of a zoned IPv6 host
     * (always `%25`-separated). Present only on the result of `parse` for a
     * bracketed IPv6 literal so `serialize`/`normalize` can reproduce the
     * exact zone without re-deriving it from the ambiguous single-`%` form.
     */
    escapedHost?: string;
    port?: number | string;
    path?: string;
    query?: string;
    fragment?: string;
    reference?: string;
    nid?: string;
    nss?: string;
    resourceName?: string;
    secure?: boolean;
    uuid?: string;
    error?: string;
    to?: string[];
    subject?: string;
    body?: string;
    headers?: { [hfname: string]: string };
  }
  export interface Options {
    scheme?: string;
    reference?: string;
    unicodeSupport?: boolean;
    domainHost?: boolean;
    absolutePath?: boolean;
    tolerant?: boolean;
    skipEscape?: boolean;
    nid?: string;
  }

  export function normalize (uri: string, opts?: Options): string
  export function normalize (uri: URIComponent, opts?: Options): URIComponent
  export function normalize (uri: any, opts?: Options): any

  export function resolve (baseURI: string, relativeURI: string, options?: Options): string

  export function resolveComponent (base: URIComponent, relative: URIComponent, options?: Options, skipNormalization?: boolean): URIComponent

  export function parse (uri: string, opts?: Options): URIComponent

  export function serialize (component: URIComponent, opts?: Options): string

  export function equal (uriA: string, uriB: string): boolean

  export function resolve (base: string, path: string): string

  export const fastUri: FastUri
  export { fastUri as default }
}

export = fastUri

export interface URIComponents {
  scheme?: string;
  userinfo?: string;
  host?: string;
  port?: number | string;
  path?: string;
  query?: string;
  fragment?: string;
  reference?: string;
  error?: string;
}
export interface options {
  scheme?: string;
  reference?: string;
  unicodeSupport?: boolean;
  domainHost?: boolean;
  absolutePath?: boolean;
  tolerant?:boolean;
}

export function parse(uri: string, opts?: options): URIComponents;

export function serialize(component: URIComponents, opts?: options): string;

export function equal(uriA: string, uriB:string): boolean;

export function resolve(base:string, path:string): string;

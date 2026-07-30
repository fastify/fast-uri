'use strict'

const { isUUID } = require('./utils')
const URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu

const supportedSchemeNames = /** @type {const} */ (['http', 'https', 'ws',
  'wss', 'urn', 'urn:uuid', 'mailto'])

/** @typedef {supportedSchemeNames[number]} SchemeName */

/**
 * @param {string} name
 * @returns {name is SchemeName}
 */
function isValidSchemeName (name) {
  return supportedSchemeNames.indexOf(/** @type {*} */ (name)) !== -1
}

/**
 * @callback SchemeFn
 * @param {import('../types/index').URIComponent} component
 * @param {import('../types/index').Options} options
 * @returns {import('../types/index').URIComponent}
 */

/**
 * @typedef {Object} SchemeHandler
 * @property {SchemeName} scheme - The scheme name.
 * @property {boolean} [domainHost] - Indicates if the scheme supports domain hosts.
 * @property {SchemeFn} parse - Function to parse the URI component for this scheme.
 * @property {SchemeFn} serialize - Function to serialize the URI component for this scheme.
 * @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
 * @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
 * @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
 */

/**
 * @param {import('../types/index').URIComponent} wsComponent
 * @returns {boolean}
 */
function wsIsSecure (wsComponent) {
  if (wsComponent.secure === true) {
    return true
  } else if (wsComponent.secure === false) {
    return false
  } else if (wsComponent.scheme) {
    return (
      wsComponent.scheme.length === 3 &&
      (wsComponent.scheme[0] === 'w' || wsComponent.scheme[0] === 'W') &&
      (wsComponent.scheme[1] === 's' || wsComponent.scheme[1] === 'S') &&
      (wsComponent.scheme[2] === 's' || wsComponent.scheme[2] === 'S')
    )
  } else {
    return false
  }
}

/** @type {SchemeFn} */
function httpParse (component) {
  if (!component.host) {
    component.error = component.error || 'HTTP URIs must have a host.'
  }

  return component
}

/** @type {SchemeFn} */
function httpSerialize (component) {
  const secure = String(component.scheme).toLowerCase() === 'https'

  // normalize the default port
  if (component.port === (secure ? 443 : 80) || component.port === '') {
    component.port = undefined
  }

  // normalize the empty path
  if (!component.path) {
    component.path = '/'
  }

  // NOTE: We do not parse query strings for HTTP URIs
  // as WWW Form Url Encoded query strings are part of the HTML4+ spec,
  // and not the HTTP spec.

  return component
}

/** @type {SchemeFn} */
function wsParse (wsComponent) {
// indicate if the secure flag is set
  wsComponent.secure = wsIsSecure(wsComponent)

  // construct resouce name
  wsComponent.resourceName = (wsComponent.path || '/') + (wsComponent.query ? '?' + wsComponent.query : '')
  wsComponent.path = undefined
  wsComponent.query = undefined

  return wsComponent
}

/** @type {SchemeFn} */
function wsSerialize (wsComponent) {
// normalize the default port
  if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === '') {
    wsComponent.port = undefined
  }

  // ensure scheme matches secure flag
  if (typeof wsComponent.secure === 'boolean') {
    wsComponent.scheme = (wsComponent.secure ? 'wss' : 'ws')
    wsComponent.secure = undefined
  }

  // reconstruct path from resource name
  if (wsComponent.resourceName) {
    const [path, query] = wsComponent.resourceName.split('?')
    wsComponent.path = (path && path !== '/' ? path : undefined)
    wsComponent.query = query
    wsComponent.resourceName = undefined
  }

  // forbid fragment component
  wsComponent.fragment = undefined

  return wsComponent
}

/** @type {SchemeFn} */
function urnParse (urnComponent, options) {
  if (!urnComponent.path) {
    urnComponent.error = 'URN can not be parsed'
    return urnComponent
  }
  const matches = urnComponent.path.match(URN_REG)
  if (matches) {
    const scheme = options.scheme || urnComponent.scheme || 'urn'
    urnComponent.nid = matches[1].toLowerCase()
    urnComponent.nss = matches[2]
    const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`
    const schemeHandler = getSchemeHandler(urnScheme)
    urnComponent.path = undefined

    if (schemeHandler) {
      urnComponent = schemeHandler.parse(urnComponent, options)
    }
  } else {
    urnComponent.error = urnComponent.error || 'URN can not be parsed.'
  }

  return urnComponent
}

/** @type {SchemeFn} */
function urnSerialize (urnComponent, options) {
  if (urnComponent.nid === undefined) {
    throw new Error('URN without nid cannot be serialized')
  }
  const scheme = options.scheme || urnComponent.scheme || 'urn'
  const nid = urnComponent.nid.toLowerCase()
  const urnScheme = `${scheme}:${options.nid || nid}`
  const schemeHandler = getSchemeHandler(urnScheme)

  if (schemeHandler) {
    urnComponent = schemeHandler.serialize(urnComponent, options)
  }

  const uriComponent = urnComponent
  const nss = urnComponent.nss
  uriComponent.path = `${nid || options.nid}:${nss}`

  options.skipEscape = true
  return uriComponent
}

/** @type {SchemeFn} */
function urnuuidParse (urnComponent, options) {
  const uuidComponent = urnComponent
  uuidComponent.uuid = uuidComponent.nss
  uuidComponent.nss = undefined

  if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
    uuidComponent.error = uuidComponent.error || 'UUID is not valid.'
  }

  return uuidComponent
}

/** @type {SchemeFn} */
function urnuuidSerialize (uuidComponent) {
  const urnComponent = uuidComponent
  // normalize UUID
  urnComponent.nss = (uuidComponent.uuid || '').toLowerCase()
  return urnComponent
}

const http = /** @type {SchemeHandler} */ ({
  scheme: 'http',
  domainHost: true,
  parse: httpParse,
  serialize: httpSerialize
})

const https = /** @type {SchemeHandler} */ ({
  scheme: 'https',
  domainHost: http.domainHost,
  parse: httpParse,
  serialize: httpSerialize
})

const ws = /** @type {SchemeHandler} */ ({
  scheme: 'ws',
  domainHost: true,
  parse: wsParse,
  serialize: wsSerialize
})

const wss = /** @type {SchemeHandler} */ ({
  scheme: 'wss',
  domainHost: ws.domainHost,
  parse: ws.parse,
  serialize: ws.serialize
})

const urn = /** @type {SchemeHandler} */ ({
  scheme: 'urn',
  parse: urnParse,
  serialize: urnSerialize,
  skipNormalize: true
})

const urnuuid = /** @type {SchemeHandler} */ ({
  scheme: 'urn:uuid',
  parse: urnuuidParse,
  serialize: urnuuidSerialize,
  skipNormalize: true
})

/**
 * Allow-sets used by `encodeWithAllow`. `LOCAL_PART_CHARS` is the intersection
 * of upstream uri-js's VCHAR and NOT_PATH_NOSCHEME, minus ",": the serializer
 * joins recipients with "," and `mailtoParse` splits the path on it, so a comma
 * left literal inside a local part would silently become a recipient delimiter.
 * `HFNAME_CHARS` is the qchar allow-set used for header names/values.
 * `DTEXT_CHARS` is RFC 6068 dtext-no-obs restricted to characters that are also
 * safe in a URI path; the IRI variant additionally permits non-ASCII for
 * `unicodeSupport`.
 */
const LOCAL_PART_CHARS = /^[A-Za-z0-9\-._~!$'()*+=]$/u
const HFNAME_CHARS = /^[A-Za-z0-9\-._~!$'()*+,;:@]$/u
const DTEXT_CHARS = /^[A-Za-z0-9\-._~!$'()*+;:]$/u
const DTEXT_CHARS_IRI = /^(?:[A-Za-z0-9\-._~!$'()*+;:]|[^\0-\x7F])$/u
const HEX_PAIR = /^[\da-f]{2}$/iu
const MAILTO_DOMAIN_LITERAL = /^\[[\x21-\x5A\x5E-\x7E]*\]$/u
const MAILTO_DOMAIN_ERROR = 'URI mailto has an invalid recipient domain.'

/**
 * @param {string} str
 * @returns {string}
 */
function decodeHex (str) {
  if (typeof str !== 'string' || str.indexOf('%') === -1) {
    return str
  }
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

/**
 * @param {string} input
 * @param {RegExp} allowed
 * @returns {string}
 */
function encodeWithAllow (input, allowed) {
  let result = ''
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch === '%' && i + 2 < input.length && HEX_PAIR.test(input.slice(i + 1, i + 3))) {
      result += '%' + input.slice(i + 1, i + 3).toUpperCase()
      i += 3
      continue
    }

    const code = input.charCodeAt(i)
    let codePoint = ch
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        codePoint = input.slice(i, i + 2)
        i += 2
      } else {
        codePoint = '\uFFFD'
        i++
      }
    } else if (code >= 0xD800 && code <= 0xDFFF) {
      codePoint = '\uFFFD'
      i++
    } else {
      i++
    }

    result += allowed.test(codePoint) ? codePoint : encodeURIComponent(codePoint)
  }
  return result
}

/**
 * @param {string} domain
 * @param {import('../types/index').Options} [options]
 * @param {{error?:string}} [component]
 * @returns {string}
 */
function mailtoNormalizeDomain (domain, options, component) {
  const normalizedDomain = String(domain).toLowerCase()

  if (MAILTO_DOMAIN_LITERAL.test(normalizedDomain)) {
    return normalizedDomain
  }

  try {
    const parsedDomain = new URL('http://' + normalizedDomain)
    if (
      parsedDomain.username ||
      parsedDomain.password ||
      parsedDomain.port ||
      parsedDomain.pathname !== '/' ||
      parsedDomain.search ||
      parsedDomain.hash ||
      !parsedDomain.hostname
    ) {
      throw new Error(MAILTO_DOMAIN_ERROR)
    }

    return options && options.unicodeSupport
      ? normalizedDomain
      : parsedDomain.hostname
  } catch {
    if (component) {
      component.error = component.error || MAILTO_DOMAIN_ERROR
    }
    return normalizedDomain
  }
}

/**
 * Percent-encodes everything in a recipient domain that is not `dtext-no-obs`
 * (RFC 6068). Serialize-only: `mailtoNormalizeDomain` returns the domain
 * verbatim when validation fails, and `MAILTO_DOMAIN_LITERAL` accepts the full
 * RFC 5321 dcontent range (which includes "?", "#", "&" and "/"), so without
 * this an attacker-supplied recipient could inject header fields or a fragment
 * into the serialized URI. `mailtoParse` deliberately reports the raw domain
 * instead, so it must not use this.
 * @param {string} domain
 * @param {import('../types/index').Options} [options]
 * @returns {string}
 */
function mailtoEncodeDomain (domain, options) {
  const allowed = options && options.unicodeSupport ? DTEXT_CHARS_IRI : DTEXT_CHARS

  // Keep the delimiters of a domain literal, encode its contents.
  if (domain.length > 1 && domain[0] === '[' && domain[domain.length - 1] === ']') {
    return '[' + encodeWithAllow(domain.slice(1, -1), allowed) + ']'
  }

  return encodeWithAllow(domain, allowed)
}

/**
 * @param {import('../types/index').URIComponent} component
 * @param {import('../types/index').Options} options
 * @returns {import('../types/index').URIComponent}
 */
function mailtoParse (component, options) {
  const mailtoComponent = component
  const to = (mailtoComponent.path ? String(mailtoComponent.path).split(',') : [])
  mailtoComponent.path = undefined

  if (mailtoComponent.query) {
    // Null prototype: header names come from untrusted input, so `headers[name]`
    // must not resolve to inherited members ("constructor", "toString", ...),
    // and "__proto__" has to land as a plain own property instead of hitting
    // Object.prototype's setter and being silently dropped.
    /** @type {Record<string,string>} */
    const headers = Object.create(null)
    let unknownHeaders = false
    const hfields = String(mailtoComponent.query).split('&')
    for (let i = 0; i < hfields.length; i++) {
      const token = hfields[i]
      const eqCount = token.split('=').length - 1
      if (eqCount > 1) {
        mailtoComponent.error = mailtoComponent.error || 'URI mailto has malformed header fields.'
        continue
      }
      const split = token.split('=')
      const name = split[0]
      const value = split.length > 1 ? split[1] : ''
      if (name === 'to') {
        const addrs = value.split(',')
        for (let j = 0; j < addrs.length; j++) to.push(addrs[j])
        continue
      }
      if (name === 'subject') {
        mailtoComponent.subject = decodeHex(value)
        continue
      }
      if (name === 'body') {
        mailtoComponent.body = decodeHex(value)
        continue
      }
      unknownHeaders = true
      headers[decodeHex(name)] = decodeHex(value)
    }
    if (unknownHeaders) mailtoComponent.headers = headers
  }

  mailtoComponent.query = undefined

  for (let i = 0; i < to.length; i++) {
    const rawAddr = to[i]
    const atIdx = String(rawAddr).lastIndexOf('@')
    if (atIdx < 0) {
      mailtoComponent.error = mailtoComponent.error || MAILTO_DOMAIN_ERROR
      to[i] = decodeHex(String(rawAddr))
      continue
    }
    const rawLocal = String(rawAddr).slice(0, atIdx)
    const rawDomain = String(rawAddr).slice(atIdx + 1)
    const local = decodeHex(rawLocal)
    const domain = mailtoNormalizeDomain(decodeHex(rawDomain), options, mailtoComponent)
    to[i] = local + '@' + domain
  }

  if (to.length) mailtoComponent.to = to

  return mailtoComponent
}

/**
 * @param {import('../types/index').URIComponent} component
 * @param {import('../types/index').Options} options
 * @returns {import('../types/index').URIComponent}
 */
function mailtoSerialize (component, options) {
  const mailtoComponent = component
  const to = Array.isArray(mailtoComponent.to) ? mailtoComponent.to.slice() : []
  if (to.length) {
    for (let i = 0; i < to.length; i++) {
      const addr = String(to[i])
      const atIdx = addr.lastIndexOf('@')
      const rawLocal = atIdx >= 0 ? addr.slice(0, atIdx) : addr
      const rawDomain = atIdx >= 0 ? addr.slice(atIdx + 1) : ''
      const local = encodeWithAllow(rawLocal, LOCAL_PART_CHARS)
      const decodedDomain = decodeHex(rawDomain)
      // `component` is intentionally not passed: index.js's `serialize` writes
      // the error onto a private copy and returns only a string, so an error
      // recorded here would be unreachable. Safety comes from encoding instead.
      const normalizedDomain = mailtoNormalizeDomain(decodedDomain, options)
      to[i] = local + '@' + mailtoEncodeDomain(normalizedDomain, options)
    }
    // Every recipient is now fully encoded and only the joining commas are
    // literal, so bypass index.js's generic encoder, whose allow-set is
    // narrower than upstream's and would over-encode.
    mailtoComponent.path = to.join(',')
    options.skipEscape = true
  } else {
    // No recipients: drop any caller-supplied path, matching upstream uri-js.
    // `to` is the only recipient source, and `mailtoParse` always moves the
    // path into it, so a mailto component never legitimately carries one.
    mailtoComponent.path = undefined
  }

  const headers = mailtoComponent.headers && typeof mailtoComponent.headers === 'object'
    ? Object.assign(Object.create(null), mailtoComponent.headers)
    : Object.create(null)

  if (mailtoComponent.subject) headers.subject = mailtoComponent.subject
  if (mailtoComponent.body) headers.body = mailtoComponent.body
  mailtoComponent.headers = headers

  if (Object.keys(headers).length) {
    const fields = []
    for (const name in headers) {
      if (!Object.prototype.hasOwnProperty.call(headers, name)) continue
      const encodedName = encodeWithAllow(name, HFNAME_CHARS)
      const encodedValue = encodeWithAllow(String(headers[name]), HFNAME_CHARS)
      fields.push(encodedName + '=' + encodedValue)
    }
    if (fields.length) mailtoComponent.query = fields.join('&')
  } else {
    mailtoComponent.headers = undefined
  }

  return mailtoComponent
}

const mailto = /** @type {SchemeHandler} */ ({
  scheme: 'mailto',
  parse: mailtoParse,
  serialize: mailtoSerialize,
  domainHost: false,
  unicodeSupport: true
})

const SCHEMES = /** @type {Record<SchemeName, SchemeHandler>} */ ({
  http,
  https,
  ws,
  wss,
  urn,
  'urn:uuid': urnuuid,
  mailto
})

Object.setPrototypeOf(SCHEMES, null)

/**
 * @param {string|undefined} scheme
 * @returns {SchemeHandler|undefined}
 */
function getSchemeHandler (scheme) {
  return (
    scheme && (
      SCHEMES[/** @type {SchemeName} */ (scheme)] ||
      SCHEMES[/** @type {SchemeName} */(scheme.toLowerCase())])
  ) ||
    undefined
}

module.exports = {
  wsIsSecure,
  SCHEMES,
  isValidSchemeName,
  getSchemeHandler,
}

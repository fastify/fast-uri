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
 * Allow-sets used by `encodeWithAllow`. `LOCAL_PART_CHARS` matches the
 * intersection of upstream uri-js's VCHAR and NOT_PATH_NOSCHEME;
 * `HFNAME_CHARS` is the qchar allow-set used for header names/values.
 */
const LOCAL_PART_CHARS = /[A-Za-z0-9\-._~!$'()*+,=]/g
const HFNAME_CHARS = /[A-Za-z0-9\-._~!$&'()*+,;:@]/g
const HEX_PAIR = /^[\da-f]{2}$/iu

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
 * @param {string} ch
 * @returns {string}
 */
function pctEncChar (ch) {
  const code = ch.codePointAt(0)
  if (code === undefined) return ''
  if (code < 0x80) {
    return '%' + code.toString(16).toUpperCase().padStart(2, '0')
  }
  if (code < 0x800) {
    return '%' + ((code >> 6) | 0xC0).toString(16).toUpperCase().padStart(2, '0') +
           '%' + ((code & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0')
  }
  if (code < 0x10000) {
    return '%' + ((code >> 12) | 0xE0).toString(16).toUpperCase().padStart(2, '0') +
           '%' + (((code >> 6) & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0') +
           '%' + ((code & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0')
  }
  return '%' + ((code >> 18) | 0xF0).toString(16).toUpperCase().padStart(2, '0') +
         '%' + (((code >> 12) & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0') +
         '%' + (((code >> 6) & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0') +
         '%' + ((code & 0x3F) | 0x80).toString(16).toUpperCase().padStart(2, '0')
}

/**
 * @param {string} input
 * @param {RegExp} allowed
 * @returns {string}
 */
function encodeWithAllow (input, allowed) {
  let result = ''
  let buf = ''
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch === '%' && i + 2 < input.length && HEX_PAIR.test(input.slice(i + 1, i + 3))) {
      if (buf) {
        result += encodeBuffer(buf, allowed)
        buf = ''
      }
      result += '%' + input.slice(i + 1, i + 3).toUpperCase()
      i += 3
      continue
    }
    buf += ch
    i++
  }
  if (buf) {
    result += encodeBuffer(buf, allowed)
  }
  return result
}

/**
 * @param {string} buf
 * @param {RegExp} allowed
 * @returns {string}
 */
function encodeBuffer (buf, allowed) {
  let out = ''
  let i = 0
  while (i < buf.length) {
    allowed.lastIndex = i
    const m = allowed.exec(buf)
    if (m === null) {
      out += pctEncChar(buf[i])
      i++
      continue
    }
    if (m.index > i) {
      for (let j = i; j < m.index; j++) {
        out += pctEncChar(buf[j])
      }
    }
    out += m[0]
    i = m.index + m[0].length
  }
  return out
}

/**
 * @param {string} domain
 * @param {{iri?:boolean}} [options]
 * @param {{error?:string}} [component]
 * @returns {string}
 */
function mailtoNormalizeDomain (domain, options, component) {
  if (options && options.iri) {
    return String(domain).toLowerCase()
  }
  try {
    return new URL('http://' + domain).hostname
  } catch (e) {
    if (component) {
      component.error = component.error || "Email address's domain name can not be converted to ASCII via punycode: " + (e && e.message ? e.message : String(e))
    }
    return String(domain).toLowerCase()
  }
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

  if (mailtoComponent.query !== undefined) {
    /** @type {Record<string,string>} */
    const headers = {}
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
    const rawLocal = atIdx >= 0 ? String(rawAddr).slice(0, atIdx) : String(rawAddr)
    const rawDomain = atIdx >= 0 ? String(rawAddr).slice(atIdx + 1) : ''
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
  // The handler fully encodes the path; bypass index.js's generic encoder,
  // whose allow-set is narrower than upstream's and would over-encode.
  options.skipEscape = true
  const to = Array.isArray(mailtoComponent.to) ? mailtoComponent.to : []
  if (to.length) {
    for (let i = 0; i < to.length; i++) {
      const addr = String(to[i])
      const atIdx = addr.lastIndexOf('@')
      const rawLocal = atIdx >= 0 ? addr.slice(0, atIdx) : addr
      const rawDomain = atIdx >= 0 ? addr.slice(atIdx + 1) : ''
      const local = encodeWithAllow(rawLocal, LOCAL_PART_CHARS)
      const decodedDomain = decodeHex(rawDomain)
      const domain = mailtoNormalizeDomain(decodedDomain, options, mailtoComponent)
      to[i] = local + '@' + domain
    }
    mailtoComponent.path = to.join(',')
  }

  const headers = mailtoComponent.headers && typeof mailtoComponent.headers === 'object'
    ? Object.assign({}, mailtoComponent.headers)
    : {}

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

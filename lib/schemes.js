'use strict'

const UUID_REG = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu
const URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu

const supportedSchemeNames = /** @type {const} */ (['http', 'https', 'ws',
  'wss', 'urn', 'urn:uuid'])

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
 * @property {SchemeFn} parse - Function to parse the URI components for this scheme.
 * @property {SchemeFn} serialize - Function to serialize the URI components for this scheme.
 * @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
 * @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
 * @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
 */

/**
 * @param {import('../types/index').URIComponent} wsComponents
 * @returns {boolean}
 */
function isSecure (wsComponents) {
  return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === 'wss'
}

/** @type {SchemeFn} */
function httpParse (components) {
  if (!components.host) {
    components.error = components.error || 'HTTP URIs must have a host.'
  }

  return components
}

/** @type {SchemeFn} */
function httpSerialize (components) {
  const secure = String(components.scheme).toLowerCase() === 'https'

  // normalize the default port
  if (components.port === (secure ? 443 : 80) || components.port === '') {
    components.port = undefined
  }

  // normalize the empty path
  if (!components.path) {
    components.path = '/'
  }

  // NOTE: We do not parse query strings for HTTP URIs
  // as WWW Form Url Encoded query strings are part of the HTML4+ spec,
  // and not the HTTP spec.

  return components
}

/** @type {SchemeFn} */
function wsParse (wsComponent) {
// indicate if the secure flag is set
  wsComponent.secure = isSecure(wsComponent)

  // construct resouce name
  wsComponent.resourceName = (wsComponent.path || '/') + (wsComponent.query ? '?' + wsComponent.query : '')
  wsComponent.path = undefined
  wsComponent.query = undefined

  return wsComponent
}

/** @type {SchemeFn} */
function wsSerialize (wsComponents) {
// normalize the default port
  if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === '') {
    wsComponents.port = undefined
  }

  // ensure scheme matches secure flag
  if (typeof wsComponents.secure === 'boolean') {
    wsComponents.scheme = (wsComponents.secure ? 'wss' : 'ws')
    wsComponents.secure = undefined
  }

  // reconstruct path from resource name
  if (wsComponents.resourceName) {
    const [path, query] = wsComponents.resourceName.split('?')
    wsComponents.path = (path && path !== '/' ? path : undefined)
    wsComponents.query = query
    wsComponents.resourceName = undefined
  }

  // forbid fragment component
  wsComponents.fragment = undefined

  return wsComponents
}

/** @type {SchemeFn} */
function urnParse (urnComponents, options) {
  if (!urnComponents.path) {
    urnComponents.error = 'URN can not be parsed'
    return urnComponents
  }
  const matches = urnComponents.path.match(URN_REG)
  if (matches) {
    const scheme = options.scheme || urnComponents.scheme || 'urn'
    urnComponents.nid = matches[1].toLowerCase()
    urnComponents.nss = matches[2]
    const urnScheme = `${scheme}:${options.nid || urnComponents.nid}`
    const schemeHandler = getSchemeHandler(urnScheme)
    urnComponents.path = undefined

    if (schemeHandler) {
      urnComponents = schemeHandler.parse(urnComponents, options)
    }
  } else {
    urnComponents.error = urnComponents.error || 'URN can not be parsed.'
  }

  return urnComponents
}

/** @type {SchemeFn} */
function urnSerialize (urnComponents, options) {
  const scheme = options.scheme || urnComponents.scheme || 'urn'
  const nid = urnComponents.nid.toLowerCase()
  const urnScheme = `${scheme}:${options.nid || nid}`
  const schemeHandler = getSchemeHandler(urnScheme)

  if (schemeHandler) {
    urnComponents = schemeHandler.serialize(urnComponents, options)
  }

  const uriComponents = urnComponents
  const nss = urnComponents.nss
  uriComponents.path = `${nid || options.nid}:${nss}`

  options.skipEscape = true
  return uriComponents
}

/** @type {SchemeFn} */
function urnuuidParse (urnComponent, options) {
  const uuidComponents = urnComponent
  uuidComponents.uuid = uuidComponents.nss
  uuidComponents.nss = undefined

  if (!options.tolerant && (!uuidComponents.uuid || !UUID_REG.test(uuidComponents.uuid))) {
    uuidComponents.error = uuidComponents.error || 'UUID is not valid.'
  }

  return uuidComponents
}

/** @type {SchemeFn} */
function urnuuidSerialize (uuidComponents) {
  const urnComponents = uuidComponents
  // normalize UUID
  urnComponents.nss = (uuidComponents.uuid || '').toLowerCase()
  return urnComponents
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

const SCHEMES = /** @type {Record<SchemeName, SchemeHandler>} */ ({
  http,
  https,
  ws,
  wss,
  urn,
  'urn:uuid': urnuuid
})

Object.setPrototypeOf(SCHEMES, null)

/**
 * @param {string|undefined} scheme
 * @returns {SchemeHandler|undefined}
 */
function getSchemeHandler (scheme) {
  if (!scheme) {
    return undefined
  }
  if (scheme in SCHEMES) {
    return SCHEMES[/** @type {SchemeName} */(scheme)]
  }
  const lowercasedScheme = scheme.toLowerCase()
  if (lowercasedScheme in SCHEMES) {
    return SCHEMES[/** @type {SchemeName} */(lowercasedScheme)]
  }
  return undefined
}

module.exports = {
  SCHEMES,
  isValidSchemeName,
  getSchemeHandler,
}

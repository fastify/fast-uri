'use strict'

const { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require('./lib/utils')
const SCHEMES = require('./lib/schemes')

const VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u
const MALFORMED_SCHEME_ERROR = 'URI scheme is malformed.'

/**
 * @param {string} scheme
 * @returns {string}
 */
function decodeValidScheme (scheme) {
  const decodedScheme = unescape(String(scheme))
  if (!VALID_SCHEME.test(decodedScheme)) {
    throw new TypeError(MALFORMED_SCHEME_ERROR)
  }
  return decodedScheme
}

function normalize (uri, options) {
  if (typeof uri === 'string') {
    uri = normalizeString(uri, options)
  } else if (typeof uri === 'object') {
    uri = parse(serialize(uri, options), options)
  }
  return uri
}

function resolve (baseURI, relativeURI, options) {
  const schemelessOptions = Object.assign({ scheme: 'null' }, options)
  const {
    parsed: baseParsed,
    malformedAuthorityOrPort: baseMalformed,
    malformedPercentEncoding: baseMalformedPercentEncoding,
    malformedSchemeSpecific: baseMalformedSchemeSpecific,
    malformedHost: baseMalformedHost,
    malformedScheme: baseMalformedScheme
  } = parseWithStatus(baseURI, schemelessOptions)
  const {
    parsed: relativeParsed,
    malformedAuthorityOrPort: relativeMalformed,
    malformedPercentEncoding: relativeMalformedPercentEncoding,
    malformedSchemeSpecific: relativeMalformedSchemeSpecific,
    malformedHost: relativeMalformedHost,
    malformedScheme: relativeMalformedScheme
  } = parseWithStatus(relativeURI, schemelessOptions)
  if (
    baseMalformed ||
    relativeMalformed ||
    baseMalformedPercentEncoding ||
    relativeMalformedPercentEncoding ||
    baseMalformedSchemeSpecific ||
    relativeMalformedSchemeSpecific ||
    baseMalformedHost ||
    relativeMalformedHost ||
    baseMalformedScheme ||
    relativeMalformedScheme
  ) {
    throw new Error(baseParsed.error || relativeParsed.error || 'URI is malformed.')
  }
  const resolved = resolveComponents(baseParsed, relativeParsed, schemelessOptions, true)
  const resolvedSchemeHandler = SCHEMES[((options && options.scheme) || resolved.scheme || '').toLowerCase()]
  const resolvedHost = resolved.host
  const resolvedHostIsIP = resolvedHost !== undefined && resolvedHost !== '' &&
    (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6)
  canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP)
  // Percent escapes in an ASCII reg-name are encoded data. The WHATWG hostname
  // parser can reject them even though fast-uri preserves them safely as RFC
  // 3986 data. A raw non-ASCII host must still fail closed if conversion fails.
  const encodedASCIIHost = resolvedHost && resolvedHost.indexOf('%') !== -1 &&
    !/\P{ASCII}/u.test(resolvedHost)
  if (resolved.error && !encodedASCIIHost) {
    throw new Error(resolved.error)
  }
  return serialize(resolved, { ...schemelessOptions, skipEscape: true })
}

function resolveComponents (base, relative, options, skipNormalization) {
  const target = {}
  if (!skipNormalization) {
    base = parse(serialize(base, options), options) // normalize base components
    relative = parse(serialize(relative, options), options) // normalize relative components
  }
  options = options || {}

  if (!options.tolerant && relative.scheme) {
    target.scheme = relative.scheme
    // target.authority = relative.authority;
    target.userinfo = relative.userinfo
    target.host = relative.host
    target.port = relative.port
    target.path = removeDotSegments(relative.path || '')
    target.query = relative.query
  } else {
    if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
      // target.authority = relative.authority;
      target.userinfo = relative.userinfo
      target.host = relative.host
      target.port = relative.port
      target.path = removeDotSegments(relative.path || '')
      target.query = relative.query
    } else {
      if (!relative.path) {
        target.path = base.path
        if (relative.query !== undefined) {
          target.query = relative.query
        } else {
          target.query = base.query
        }
      } else {
        if (relative.path.charAt(0) === '/') {
          target.path = removeDotSegments(relative.path)
        } else {
          if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
            target.path = '/' + relative.path
          } else if (!base.path) {
            target.path = relative.path
          } else {
            target.path = base.path.slice(0, base.path.lastIndexOf('/') + 1) + relative.path
          }
          target.path = removeDotSegments(target.path)
        }
        target.query = relative.query
      }
      // target.authority = base.authority;
      target.userinfo = base.userinfo
      target.host = base.host
      target.port = base.port
    }
    target.scheme = base.scheme
  }

  target.fragment = relative.fragment

  return target
}

function equal (uriA, uriB, options) {
  const normalizedA = normalizeComparableURI(uriA, options)
  const normalizedB = normalizeComparableURI(uriB, options)

  return normalizedA !== undefined && normalizedB !== undefined && normalizedA === normalizedB
}

function serialize (cmpts, opts) {
  const components = {
    host: cmpts.host,
    scheme: cmpts.scheme,
    userinfo: cmpts.userinfo,
    port: cmpts.port,
    path: cmpts.path,
    query: cmpts.query,
    nid: cmpts.nid,
    nss: cmpts.nss,
    uuid: cmpts.uuid,
    fragment: cmpts.fragment,
    reference: cmpts.reference,
    resourceName: cmpts.resourceName,
    secure: cmpts.secure,
    error: ''
  }
  const options = Object.assign({}, opts)
  const uriTokens = []

  if (components.scheme) {
    components.scheme = decodeValidScheme(components.scheme)
  }

  // find scheme handler
  const schemeHandler = SCHEMES[(options.scheme || components.scheme || '').toLowerCase()]

  // perform scheme specific serialization
  if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options)

  const hasAuthority = components.userinfo !== undefined || components.host !== undefined || components.port !== undefined
  const pathNoScheme = !options.skipEscape && components.scheme === undefined && !hasAuthority

  if (components.path !== undefined) {
    if (!options.skipEscape) {
      components.path = serializePathEncoding(components.path, pathNoScheme)
    } else {
      components.path = normalizePercentEncoding(components.path)
    }
  }

  if (options.reference !== 'suffix' && components.scheme) {
    // Scheme handlers may replace the scheme during serialization.
    components.scheme = decodeValidScheme(components.scheme)
    uriTokens.push(components.scheme)
    uriTokens.push(':')
  }

  const authority = recomposeAuthority(components, options)
  if (authority !== undefined) {
    if (options.reference !== 'suffix') {
      uriTokens.push('//')
    }

    uriTokens.push(authority)

    if (components.path && components.path.charAt(0) !== '/') {
      uriTokens.push('/')
    }
  }
  if (components.path !== undefined) {
    let s = components.path

    if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
      s = removeDotSegments(s)
    }

    // Dot-segment removal can expose a colon that was not originally in the
    // first segment (for example, "./a:b"). Reapply path-noscheme encoding so
    // the serialized relative reference cannot be reparsed as a URI scheme.
    if (pathNoScheme) {
      s = serializePathEncoding(s, true)
    }

    if (authority === undefined) {
      s = s.replace(/^\/\//u, '/%2F') // don't allow the path to start with "//"
    }

    uriTokens.push(s)
  }

  if (components.query !== undefined) {
    uriTokens.push('?')
    uriTokens.push(encodeQuery(components.query))
  }

  if (components.fragment !== undefined) {
    uriTokens.push('#')
    uriTokens.push(encodeFragment(components.fragment))
  }
  return uriTokens.join('')
}

const URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u

// Captures the authority component (between "//" and the next "/", "?" or "#"),
// with or without a scheme prefix, for the literal-backslash rejection below.
const AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/

// Captures the leading authority-introducer region after an optional scheme: a
// run of forward slashes, backslashes, and the characters the WHATWG URL parser
// removes before parsing (TAB U+0009, LF U+000A, CR U+000D). A valid introducer
// is exactly "//". Node treats "\\" as "/" on special schemes and strips those
// characters first, so forms like "\\", "/\", "\/", "/<TAB>/", or a leading
// "<TAB>//" reach an authority in Node while fast-uri's URI_PARSE folds them into
// the path group (host confusion / SSRF / redirect bypass).
const AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/

function getParseError (parsed, matches) {
  if (matches[2] !== undefined && parsed.path && parsed.path[0] !== '/') {
    return 'URI path must start with "/" when authority is present.'
  }

  if (typeof parsed.port === 'number' && (parsed.port < 0 || parsed.port > 65535)) {
    return 'URI port is malformed.'
  }

  return undefined
}

/**
 * Checks percent syntax without decoding the represented octets. RFC 3986
 * percent-encoding is byte-oriented, so sequences such as `%FF` are valid even
 * though they are not independently valid UTF-8.
 *
 * @param {string|undefined} component
 * @returns {boolean}
 */
/**
 * @param {import('./types/index').URIComponent} parsed
 * @param {import('./types/index').Options} options
 * @param {{ domainHost?: boolean, unicodeSupport?: boolean }|undefined} schemeHandler
 * @param {boolean} isIP
 * @returns {boolean} whether host conversion failed
 */
function canonicalizeHost (parsed, options, schemeHandler, isIP) {
  if (
    !options.unicodeSupport &&
    (!schemeHandler || !schemeHandler.unicodeSupport) &&
    parsed.host &&
    parsed.host[0] !== '[' &&
    (options.domainHost || (schemeHandler && schemeHandler.domainHost)) &&
    isIP === false &&
    nonSimpleDomain(parsed.host)
  ) {
    try {
      parsed.host = new URL('http://' + parsed.host).hostname
    } catch (e) {
      parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e
      return true
    }
  }
  return false
}

function hasMalformedPercentEncoding (component) {
  if (component === undefined) return false

  let percent = component.indexOf('%')
  while (percent !== -1) {
    if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) {
      return true
    }
    percent = component.indexOf('%', percent + 3)
  }

  return false
}

/**
 * @param {RegExpMatchArray} matches
 * @returns {boolean}
 */
function hasMalformedComponentPercentEncoding (matches) {
  // Bracketed IP literals use a raw "%" as the zone separator for historical
  // compatibility. Their parsing is intentionally left to normalizeIPv6.
  const host = matches[4]
  return hasMalformedPercentEncoding(matches[3]) ||
    (host !== undefined && !(host[0] === '[' && host[host.length - 1] === ']') && hasMalformedPercentEncoding(host)) ||
    hasMalformedPercentEncoding(matches[6]) ||
    hasMalformedPercentEncoding(matches[7]) ||
    hasMalformedPercentEncoding(matches[8])
}

function parseWithStatus (uri, opts) {
  const options = Object.assign({}, opts)
  const parsed = {
    scheme: undefined,
    userinfo: undefined,
    host: '',
    port: undefined,
    path: '',
    query: undefined,
    fragment: undefined
  }
  let malformedAuthorityOrPort = false
  let malformedPercentEncoding = false
  let malformedSchemeSpecific = false
  let malformedHost = false
  let malformedIPLiteral = false
  let malformedScheme = false
  let isIP = false
  if (options.reference === 'suffix') uri = (options.scheme ? options.scheme + ':' : '') + '//' + uri

  // A literal backslash (U+005C) is not a valid RFC 3986 URI character and is
  // not an authority delimiter. Reject it in the authority rather than
  // rewriting it: normalizing "\" -> "/" (WHATWG error recovery) could silently
  // change the resource identified by an otherwise-invalid input, and lets "\"
  // act as a host delimiter here while Node's native URL parses a different
  // host (SSRF / redirect / origin-allowlist bypass). Percent-encoded %5C is
  // untouched and remains valid encoded data.
  const authorityMatch = uri.match(AUTHORITY_PREFIX)
  if (authorityMatch !== null && authorityMatch[1].indexOf('\\') !== -1) {
    parsed.error = 'URI authority must not contain a literal backslash.'
    malformedAuthorityOrPort = true
  }

  // Reject a malformed or whitespace-smuggled authority introducer. fast-uri
  // only recognizes a literal "//"; anything else in the leading separator run
  // (a backslash, or a "//" that appears only after removing the TAB/LF/CR that
  // Node strips) means the authority fast-uri parses differs from the one Node's
  // URL resolves. Reject rather than rewrite, mirroring the literal-backslash
  // guard above. Percent-encoded forms (%5C, %09) are untouched, valid data.
  const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION)
  if (introducerMatch !== null) {
    const region = introducerMatch[1]
    const normalizedRegion = region.replace(/[\t\n\r]/g, '')
    // Two or more leading separators introduce an authority.
    if (normalizedRegion.length >= 2) {
      if (normalizedRegion.slice(0, 2) !== '//') {
        parsed.error = parsed.error || 'URI authority must not contain a literal backslash.'
        malformedAuthorityOrPort = true
      } else if (region.length !== normalizedRegion.length) {
        parsed.error = parsed.error || 'URI authority introducer must not contain whitespace.'
        malformedAuthorityOrPort = true
      }
    }
  }

  const matches = uri.match(URI_PARSE)

  if (matches) {
    // store each component
    parsed.scheme = matches[1]
    parsed.userinfo = matches[3]
    parsed.host = matches[4]
    parsed.port = parseInt(matches[5], 10)
    parsed.path = matches[6] || ''
    parsed.query = matches[7]
    parsed.fragment = matches[8]

    if (parsed.scheme !== undefined) {
      const decodedScheme = unescape(parsed.scheme)
      if (VALID_SCHEME.test(decodedScheme)) {
        parsed.scheme = decodedScheme.toLowerCase()
      } else {
        parsed.error = parsed.error || MALFORMED_SCHEME_ERROR
        malformedScheme = true
      }
    }

    malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches)
    if (malformedPercentEncoding) {
      parsed.error = parsed.error || 'URI contains malformed percent-encoding.'
    }

    // fix port number
    if (isNaN(parsed.port)) {
      parsed.port = matches[5]
    }

    const parseError = getParseError(parsed, matches)
    if (parseError !== undefined) {
      parsed.error = parsed.error || parseError
      malformedAuthorityOrPort = true
    }

    if (parsed.host) {
      const ipv4result = isIPv4(parsed.host)
      if (ipv4result === false) {
        const bracketedIPLiteral = parsed.host[0] === '[' && parsed.host[parsed.host.length - 1] === ']'
        const ipv6result = normalizeIPv6(parsed.host)
        isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true
        malformedIPLiteral = bracketedIPLiteral && ipv6result.error === true
        parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase()

        if (malformedIPLiteral) {
          parsed.error = parsed.error || 'URI host is malformed.'
          malformedAuthorityOrPort = true
        }
      } else {
        isIP = true
      }
    }
    if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && !parsed.path && parsed.query === undefined) {
      parsed.reference = 'same-document'
    } else if (parsed.scheme === undefined) {
      parsed.reference = 'relative'
    } else if (parsed.fragment === undefined) {
      parsed.reference = 'absolute'
    } else {
      parsed.reference = 'uri'
    }

    // check for reference errors
    if (options.reference && options.reference !== 'suffix' && options.reference !== parsed.reference) {
      parsed.error = parsed.error || 'URI is not a ' + options.reference + ' reference.'
    }

    // find scheme handler
    const schemeHandler = SCHEMES[(options.scheme || parsed.scheme || '').toLowerCase()]

    // convert Unicode IDN -> ASCII IDN when the effective scheme uses domain hosts
    malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP)

    if (!schemeHandler || (schemeHandler && !schemeHandler.skipNormalize)) {
      if (parsed.host !== undefined && !malformedIPLiteral) {
        const host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true)
        parsed.host = reescapeHostDelimiters(host, isIP)
      }
      if (parsed.path !== undefined && parsed.path.length) {
        parsed.path = normalizePathEncoding(parsed.path)
      }
      if (parsed.query !== undefined && parsed.query.length) {
        parsed.query = normalizeQueryFragmentEncoding(parsed.query)
      }
      if (parsed.fragment !== undefined && parsed.fragment.length) {
        parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment)
      }
    }

    // perform scheme specific parsing
    if (schemeHandler && schemeHandler.parse) {
      schemeHandler.parse(parsed, options)
      if (schemeHandler === SCHEMES.urn && parsed.nid === undefined) {
        malformedSchemeSpecific = true
      }
    }
  } else {
    parsed.error = parsed.error || 'URI can not be parsed.'
  }
  return { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme }
}

function parse (uri, opts) {
  return parseWithStatus(uri, opts).parsed
}

function normalizeString (uri, opts) {
  return normalizeStringWithStatus(uri, opts).normalized
}

function normalizeStringWithStatus (uri, opts) {
  const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts)
  return {
    normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
    malformedAuthorityOrPort,
    malformedPercentEncoding,
    malformedSchemeSpecific,
    malformedHost,
    malformedScheme
  }
}

function normalizeComparableURI (uri, opts) {
  if (typeof uri !== 'string' && typeof uri !== 'object') {
    return undefined
  }

  let value
  try {
    value = typeof uri === 'string' ? uri : serialize(uri, opts)
  } catch {
    return undefined
  }
  const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts)
  return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? undefined : normalized
}

const fastUri = {
  SCHEMES,
  normalize,
  resolve,
  resolveComponents,
  equal,
  serialize,
  parse
}

module.exports = fastUri
module.exports.default = fastUri
module.exports.fastUri = fastUri

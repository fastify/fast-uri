const punycode = require('punycode')
const { pctDecChars, pctEncChar, normalizeIPv6, normalizeIPv4, removeDotSegments, recomposeAuthority, normalizeComponentEncoding } = require('./utils')
const SCHEMES = require('./schemes')

function normalize (uri, options) {
  if (typeof uri === 'string') {
    uri = serialize(parse(uri, options), options)
  } else if (typeof uri === 'object') {
    uri = parse(serialize(uri, options), options)
  }
  return uri
}

function resolve (baseURI, relativeURI, options) {
  const schemelessOptions = Object.assign({ scheme: 'null' }, options)
  return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions)
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
  if (typeof uriA === 'string') {
    uriA = serialize(parse(uriA, options), options)
  } else if (typeof uriA === 'object') {
    uriA = serialize(uriA, options)
  }

  if (typeof uriB === 'string') {
    uriB = serialize(parse(uriB, options), options)
  } else if (typeof uriB === 'object') {
    uriB = serialize(uriB, options)
  }

  return uriA === uriB
}

function serialize (components, options) {
  const uriTokens = []
  // find scheme handler
  const schemeHandler = SCHEMES[(options.scheme || components.scheme || '').toLowerCase()]

  // perform scheme specific serialization
  if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options)

  if (components.host) {
    // if host component is an IPv6 address
    // if (protocol.IPV6ADDRESS.test(components.host)) {
    // TODO: normalize IPv6 address as per RFC 5952
    // }

    // if host component is a domain name
    /* else */ if (options.domainHost || (schemeHandler && schemeHandler.domainHost)) {
      // convert IDN via punycode
      try {
        components.host = (!options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host))
      } catch (e) {
        components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? 'ASCII' : 'Unicode') + ' via punycode: ' + e
      }
    }
  }

  // normalize encoding
  normalizeComponentEncoding(components, protocol)

  if (options.reference !== 'suffix' && components.scheme) {
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

    if (authority === undefined) {
      s = s.replace(/^\/\//, '/%2F') // don't allow the path to start with "//"
    }

    uriTokens.push(s)
  }

  if (components.query !== undefined) {
    uriTokens.push('?')
    uriTokens.push(components.query)
  }

  if (components.fragment !== undefined) {
    uriTokens.push('#')
    uriTokens.push(components.fragment)
  }

  return uriTokens.join()
}

function parse (uri, options) {
// const protocol = (options.iri ? IRI_PROTOCOL : URI_PROTOCOL)
  const protocol = true
  const parsed = {
    error: undefined,
    scheme: undefined,
    userinfo: '',
    host: '',
    port: undefined,
    path: '',
    query: undefined,
    fragment: undefined
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

  if (parsed.host) {
    parsed.host = normalizeIPv6(normalizeIPv4(parsed.host, protocol), protocol)
  }

  return parsed
}

function escapeComponent (str, options) {
  return str
}

function unescapeComponent (str, options) {
  return str
}

module.exports = {
  normalize,
  resolve,
  resolveComponents,
  equal,
  serialize,
  parse,
  escapeComponent,
  unescapeComponent
}

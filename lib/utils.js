'use strict'

const { HEX } = require('./scopedChars')

function normalizeIPv4 (host) {
  if (findToken(host, '.') < 3) { return { host, isIPV4: false } }
  const matches = host.match(/^(\b[01]?\d{1,2}|\b2[0-4]\d|\b25[0-5])(\.([01]?\d{1,2}|2[0-4]\d|25[0-5])){3}$/u) || []
  const [address] = matches
  if (address) {
    return { host: stripLeadingZeros(address, '.'), isIPV4: true }
  } else {
    return { host, isIPV4: false }
  }
}

/**
 * @param {string[]} input
 * @param {boolean} [keepZero=false]
 * @returns {string|undefined}
 */
function stringArrayToHexStripped (input, keepZero = false) {
  let acc = ''
  let strip = true
  for (const c of input) {
    if (HEX[c] === undefined) return undefined
    if (c !== '0' && strip === true) strip = false
    if (!strip) acc += c
  }
  if (keepZero && acc.length === 0) acc = '0'
  return acc
}

function getIPV6 (input) {
  let tokenCount = 0
  const output = { error: false, address: '', zone: '' }
  const address = []
  const buffer = []
  let isZone = false
  let endipv6Encountered = false
  let endIpv6 = false

  function consume () {
    if (buffer.length) {
      if (isZone === false) {
        const hex = stringArrayToHexStripped(buffer)
        if (hex !== undefined) {
          address.push(hex)
        } else {
          output.error = true
          return false
        }
      }
      buffer.length = 0
    }
    return true
  }

  for (let i = 0; i < input.length; i++) {
    const cursor = input[i]
    if (cursor === '[' || cursor === ']') { continue }
    if (cursor === ':') {
      if (endipv6Encountered === true) {
        endIpv6 = true
      }
      if (!consume()) { break }
      tokenCount++
      address.push(':')
      if (tokenCount > 7) {
        // not valid
        output.error = true
        break
      }
      if (i - 1 >= 0 && input[i - 1] === ':') {
        endipv6Encountered = true
      }
      continue
    } else if (cursor === '%') {
      if (!consume()) { break }
      // switch to zone detection
      isZone = true
    } else {
      buffer.push(cursor)
      continue
    }
  }
  if (buffer.length) {
    if (isZone) {
      output.zone = buffer.join('')
    } else if (endIpv6) {
      address.push(buffer.join(''))
    } else {
      address.push(stringArrayToHexStripped(buffer))
    }
  }
  output.address = address.join('')
  return output
}

function normalizeIPv6 (host, opts = {}) {
  if (findToken(host, ':') < 2) { return { host, isIPV6: false } }
  const ipv6 = getIPV6(host)

  if (!ipv6.error) {
    let newHost = ipv6.address
    let escapedHost = ipv6.address
    if (ipv6.zone) {
      newHost += '%' + ipv6.zone
      escapedHost += '%25' + ipv6.zone
    }
    return { host: newHost, escapedHost, isIPV6: true }
  } else {
    return { host, isIPV6: false }
  }
}

function stripLeadingZeros (str, token) {
  let out = ''
  let skip = true
  const l = str.length
  for (let i = 0; i < l; i++) {
    const c = str[i]
    if (c === '0' && skip) {
      if ((i + 1 <= l && str[i + 1] === token) || i + 1 === l) {
        out += c
        skip = false
      }
    } else {
      if (c === token) {
        skip = true
      } else {
        skip = false
      }
      out += c
    }
  }
  return out
}

function findToken (str, token) {
  let ind = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === token) ind++
  }
  return ind
}

const RDS1 = /^\.\.?\//u
const RDS2 = /^\/\.(?:\/|$)/u
const RDS3 = /^\/\.\.(?:\/|$)/u
const RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/u

function removeDotSegments (input) {
  const output = []

  while (input.length) {
    if (input.match(RDS1)) {
      input = input.replace(RDS1, '')
    } else if (input.match(RDS2)) {
      input = input.replace(RDS2, '/')
    } else if (input.match(RDS3)) {
      input = input.replace(RDS3, '/')
      output.pop()
    } else if (input === '.' || input === '..') {
      input = ''
    } else {
      const im = input.match(RDS5)
      if (im) {
        const s = im[0]
        input = input.slice(s.length)
        output.push(s)
      } else {
        throw new Error('Unexpected dot segment condition')
      }
    }
  }
  return output.join('')
}

/**
 * Re-escape RFC 3986 gen-delims that must not appear literally in the host.
 * After the URI regex parses, these characters cannot be literal in the host
 * field, so any that appear after decoding came from percent-encoding and
 * must be restored to prevent authority structure changes.
 *
 * @param {string} host
 * @param {boolean} isIP - true for IPv4/IPv6 hosts (skip colon re-escaping)
 * @returns {string}
 */
const HOST_DELIMS = { '@': '%40', '/': '%2F', '?': '%3F', '#': '%23', ':': '%3A' }
const HOST_DELIM_RE = /[@/?#:]/g
const HOST_DELIM_NO_COLON_RE = /[@/?#]/g

function reescapeHostDelimiters (host, isIP) {
  const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE
  re.lastIndex = 0
  return host.replace(re, (ch) => HOST_DELIMS[ch])
}

const isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu)
const isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu)
const isPathCharacter = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu)

/**
 * Normalizes percent escapes and optionally decodes only unreserved ASCII bytes.
 * Reserved delimiters such as `%2F` and `%2E` stay escaped.
 *
 * @param {string} input
 * @param {boolean} [decodeUnreserved=false]
 * @returns {string}
 */
function normalizePercentEncoding (input, decodeUnreserved = false) {
  if (input.indexOf('%') === -1) {
    return input
  }

  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase()
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16))

        if (decodeUnreserved && isUnreserved(decoded)) {
          output += decoded
        } else {
          output += '%' + normalizedHex
        }

        i += 2
        continue
      }
    }

    output += input[i]
  }

  return output
}

/**
 * Normalizes path data without turning reserved escapes into live path syntax.
 * Valid escapes are uppercased, raw unsafe characters are escaped, and only
 * unreserved bytes that are not `.` are decoded.
 *
 * @param {string} input
 * @returns {string}
 */
function normalizePathEncoding (input) {
  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase()
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16))

        if (decoded !== '.' && isUnreserved(decoded)) {
          output += decoded
        } else {
          output += '%' + normalizedHex
        }

        i += 2
        continue
      }
    }

    if (isPathCharacter(input[i])) {
      output += input[i]
    } else {
      output += escape(input[i])
    }
  }

  return output
}

/**
 * Escapes a component while preserving existing valid percent escapes.
 *
 * @param {string} input
 * @returns {string}
 */
function escapePreservingEscapes (input) {
  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        output += '%' + hex.toUpperCase()
        i += 2
        continue
      }
    }

    output += escape(input[i])
  }

  return output
}

function recomposeAuthority (components, options) {
  const uriTokens = []

  if (components.userinfo !== undefined) {
    uriTokens.push(components.userinfo)
    uriTokens.push('@')
  }

  if (components.host !== undefined) {
    let host = unescape(components.host)
    const ipV4res = normalizeIPv4(host)

    if (ipV4res.isIPV4) {
      host = ipV4res.host
    } else {
      const ipV6res = normalizeIPv6(ipV4res.host, { isIPV4: false })
      if (ipV6res.isIPV6 === true) {
        host = `[${ipV6res.escapedHost}]`
      } else {
        host = reescapeHostDelimiters(host, false)
      }
    }
    uriTokens.push(host)
  }

  if (typeof components.port === 'number' || typeof components.port === 'string') {
    uriTokens.push(':')
    uriTokens.push(String(components.port))
  }

  return uriTokens.length ? uriTokens.join('') : undefined
};

module.exports = {
  recomposeAuthority,
  reescapeHostDelimiters,
  normalizePercentEncoding,
  normalizePathEncoding,
  escapePreservingEscapes,
  removeDotSegments,
  normalizeIPv4,
  normalizeIPv6,
  stringArrayToHexStripped
}

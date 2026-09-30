'use strict'

/** @type {(value: string) => boolean} */
const isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu)

/** @type {(value: string) => boolean} */
const isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u)

/** @type {(value: string) => boolean} */
const isPort = RegExp.prototype.test.bind(/^\d*$/u)

/** @type {(value: string) => boolean} */
const isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu)

/** @type {(value: string) => boolean} */
const isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u)

/** @type {(value: string) => boolean} */
const isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u)

/** @type {(value: string) => boolean} */
const isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u)

/** @type {(value: string) => boolean} */
const isRegNameCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=]$/u)

/** @type {(value: string) => boolean} */
const isLiteralRegName = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=]*$/u)

/**
 * Whole-string fast-path predicates for the per-character encoding loops.
 * An input that is entirely made of allowed literal characters and contains
 * no "%" needs no normalization or encoding: the loops would return it
 * unchanged. The sets mirror `isPathCharacter`, `isQueryFragmentCharacter` and
 * `isUserinfoCharacter` exactly.
 */
/** @type {(value: string) => boolean} */
const isLiteralPath = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]*$/u)

/** @type {(value: string) => boolean} */
const isLiteralQueryFragment = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]*$/u)

/** @type {(value: string) => boolean} */
const isLiteralUserinfo = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]*$/u)

/** @type {(value: string) => boolean} */
const isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/)

/**
 * ASCII lookup tables for the per-character allow-sets above. Filled from the
 * exact same regexes so table lookups are provably equivalent to the bound
 * `RegExp.prototype.test` calls they replace in the hot encoding loops
 * (the regexes only ever match a single ASCII character, so code points
 * >= 0x80 always take the non-ASCII branch exactly as before).
 */
const HEX_DIGIT_TABLE = new Uint8Array(128)
const HEX_DIGIT_VALUE = new Uint8Array(128)
/** @type {string[]} */
const HEX_UPPER_CHARS = new Array(128)
const UNRESERVED_TABLE = new Uint8Array(128)
const ZONE_TABLE = new Uint8Array(128)
const PATH_TABLE = new Uint8Array(128)
const QUERY_FRAGMENT_TABLE = new Uint8Array(128)
const USERINFO_TABLE = new Uint8Array(128)
const REG_NAME_TABLE = new Uint8Array(128)
{
  const HEX = /^[0-9A-Fa-f]$/
  for (let i = 0; i < 128; i++) {
    const ch = String.fromCharCode(i)
    if (HEX.test(ch)) {
      HEX_DIGIT_TABLE[i] = 1
      HEX_DIGIT_VALUE[i] = parseInt(ch, 16)
      HEX_UPPER_CHARS[i] = ch.toUpperCase()
    }
    UNRESERVED_TABLE[i] = isUnreserved(ch) ? 1 : 0
    ZONE_TABLE[i] = isZoneCharacter(ch) ? 1 : 0
    PATH_TABLE[i] = isPathCharacter(ch) ? 1 : 0
    QUERY_FRAGMENT_TABLE[i] = isQueryFragmentCharacter(ch) ? 1 : 0
    USERINFO_TABLE[i] = isUserinfoCharacter(ch) ? 1 : 0
    REG_NAME_TABLE[i] = isRegNameCharacter(ch) ? 1 : 0
  }
}

/**
 * @param {Array<string>} input
 * @returns {string}
 */
function stringArrayToHexStripped (input) {
  let acc = ''
  let code = 0
  let i = 0

  for (i = 0; i < input.length; i++) {
    code = input[i].charCodeAt(0)
    if (code === 48) {
      continue
    }
    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
      return ''
    }
    acc += input[i]
    break
  }

  for (i += 1; i < input.length; i++) {
    code = input[i].charCodeAt(0)
    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
      return ''
    }
    acc += input[i]
  }
  return acc
}

/** @type {(value: string) => boolean} */
const isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/)

/** @type {(value: string) => boolean} */
const isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/)

/**
 * @param {string} value
 * @returns {boolean}
 */
const nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u)

/** @type {(value: string) => boolean} */
const nonSimpleDomainChars = RegExp.prototype.test.bind(/[^\d!"$&'()*+,\-.;=_`a-z{}~]/u)

/** @type {(value: string) => boolean} */
const numericLastLabel = RegExp.prototype.test.bind(/(?:^|\.)(?:\d+|0x[\da-f]+)\.*$/iu)

/** @type {(value: string) => boolean} */
const isAscii = RegExp.prototype.test.bind(/^[\u0020-\u007E]*$/u)

/**
 * True when `new URL('http://' + domain).hostname` may differ from `domain`,
 * i.e. when the caller must fall back to the WHATWG parser.
 *
 * Same purpose as `nonSimpleDomain`, but digits are allowed: for this character
 * set `hostname` is the identity, *except* that an all-numeric final label is
 * read as IPv4 shorthand ("1.2.3" -> "1.2.0.3", "127.1" -> "127.0.0.1",
 * "a.b.1" throws), which is why `nonSimpleDomain` excludes digits outright.
 * Rejecting that one shape lets the common `mail2.example.org` case stay on the
 * fast path.
 *
 * @param {string} domain - must already be lowercased
 * @returns {boolean}
 */
function nonSimpleMailtoDomain (domain) {
  return nonSimpleDomainChars(domain) || numericLastLabel(domain)
}

/**
 * Returns the already-canonical lowercased host when consulting the WHATWG
 * parser would be a no-op, i.e. when `new URL('http://' + host).hostname`
 * would return exactly the ASCII-lowercased input. Returns `undefined` when
 * the caller must fall back to WHATWG construction.
 *
 * Only a pure-ASCII host qualifies: JavaScript `toLowerCase` of a non-ASCII
 * upper-case letter can fold to ASCII (e.g. the Kelvin sign -> "k") while
 * WHATWG would still send the original through IDNA.
 *
 * @param {string} host - host as parsed (any case)
 * @returns {string|undefined}
 */
function fastLowerAsciiHost (host) {
  if (!isAscii(host)) return undefined
  const hostLower = host.toLowerCase()
  return nonSimpleDomainChars(hostLower) || numericLastLabel(hostLower)
    ? undefined
    : hostLower
}

/**
 * @param {string} zone
 * @returns {boolean}
 */
function isZoneIdentifier (zone) {
  if (zone.length === 0) return false

  for (let i = 0; i < zone.length; i++) {
    const code = zone.charCodeAt(i)
    if (code < 128 && ZONE_TABLE[code] === 1) continue
    if (code === 37 && i + 2 < zone.length) { // '%'
      const h1 = zone.charCodeAt(i + 1)
      const h2 = zone.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        i += 2
        continue
      }
    }
    return false
  }

  return true
}

/**
 * Compresses the longest run of zero hextets to "::" per RFC 5952. A run of a
 * single zero hextet is left uncompressed. On ties the leftmost run wins.
 *
 * @param {string[]} hextets
 * @returns {string}
 */
function compressIPv6ZeroRun (hextets) {
  let bestStart = -1
  let bestLength = 0
  let runStart = -1
  let runLength = 0
  for (let i = 0; i < hextets.length; i++) {
    if (hextets[i] === '0') {
      if (runStart === -1) runStart = i
      runLength++
      if (runLength > bestLength) {
        bestLength = runLength
        bestStart = runStart
      }
    } else {
      runStart = -1
      runLength = 0
    }
  }

  if (bestLength < 2) return hextets.join(':')

  const head = hextets.slice(0, bestStart).join(':')
  const tail = hextets.slice(bestStart + bestLength).join(':')
  return head + '::' + tail
}

/**
 * Validates an IPv6 address against the alternatives in RFC 3986 section
 * 3.2.2 and returns the same address with leading hextet zeroes removed.
 * An embedded IPv4 address counts as two hextets and is only valid at the end.
 *
 * @param {string} input
 * @returns {string|undefined}
 */
function normalizeIPv6Address (input) {
  const compression = input.indexOf('::')
  if (compression !== -1 && input.indexOf('::', compression + 1) !== -1) return undefined

  const left = compression === -1 ? input.split(':') : input.slice(0, compression).split(':')
  const right = compression === -1 ? [] : input.slice(compression + 2).split(':')
  if (compression !== -1) {
    if (left.length === 1 && left[0] === '') left.length = 0
    if (right.length === 1 && right[0] === '') right.length = 0
  }

  const parts = left.concat(right)
  let hextetCount = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part === '') return undefined

    if (part.indexOf('.') !== -1) {
      if (i !== parts.length - 1 || (compression !== -1 && right.length === 0) || !isIPv4(part)) return undefined
      hextetCount += 2
      continue
    }

    if (!isHextet(part)) return undefined
    parts[i] = parseInt(part, 16).toString(16)
    hextetCount++
  }

  if (compression === -1) {
    if (hextetCount !== 8) return undefined
    return compressIPv6ZeroRun(parts)
  }
  if (hextetCount >= 8) return undefined

  // expand "::" then re-compress the longest run for a canonical result
  const expanded = parts.slice(0, left.length)
  for (let i = hextetCount; i < 8; i++) expanded.push('0')
  for (let i = left.length; i < parts.length; i++) expanded.push(parts[i])
  return compressIPv6ZeroRun(expanded)
}

/**
 * @typedef {Object} NormalizeIPv6Result
 * @property {string} host - The normalized host.
 * @property {string} [escapedHost] - The escaped host.
 * @property {boolean} isIPV6 - Indicates if the host is an IPv6 address.
 * @property {boolean} [isIPVFuture] - Indicates if the host is an IPvFuture literal.
 * @property {boolean} [error] - Indicates if a bracketed IP literal is malformed.
 */

/**
 * Validates and normalizes a bracketed IP literal. Raw zone separators remain
 * accepted for backwards compatibility, while encoded separators and zone
 * contents follow RFC 6874.
 *
 * @param {string} host
 * @returns {NormalizeIPv6Result}
 */
function normalizeIPv6 (host) {
  const bracketed = host[0] === '[' && host[host.length - 1] === ']'
  const hasBracket = host[0] === '[' || host[host.length - 1] === ']'
  if (hasBracket && !bracketed) return { host, isIPV6: false, error: true }

  let input = bracketed ? host.slice(1, -1) : host
  if (bracketed && isIPvFuture(input)) {
    input = input.toLowerCase()
    return { host: `[${input}]`, escapedHost: input, isIPV6: false, isIPVFuture: true }
  }

  if (findToken(input, ':') < 2) {
    return { host, isIPV6: false, error: bracketed }
  }

  let zoneIdentifier = ''
  const zoneSeparator = input.indexOf('%')
  if (zoneSeparator !== -1) {
    const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === '%25' ? 3 : 1
    zoneIdentifier = input.slice(zoneSeparator + separatorLength)
    if (!isZoneIdentifier(zoneIdentifier)) return { host, isIPV6: false, error: true }
    input = input.slice(0, zoneSeparator)
  }

  const address = normalizeIPv6Address(input)
  if (address === undefined) return { host, isIPV6: false, error: true }

  return {
    host: address + (zoneIdentifier ? '%' + zoneIdentifier : ''),
    escapedHost: address + (zoneIdentifier ? '%25' + zoneIdentifier : ''),
    isIPV6: true
  }
}

/**
 * @param {string} str
 * @param {string} token
 * @returns {number}
 */
function findToken (str, token) {
  let ind = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === token) ind++
  }
  return ind
}

/**
 * @param {string} path
 * @returns {string}
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
 */
function removeDotSegments (path) {
  // Dot-segment removal can only rewrite a path containing a "."; skipping
  // the segment loop for one without any is the common no-op case.
  if (path.indexOf('.') === -1) {
    return path
  }

  let input = path
  const output = []
  let nextSlash = -1
  let len = 0

  // eslint-disable-next-line no-cond-assign
  while (len = input.length) {
    if (len === 1) {
      if (input === '.') {
        break
      } else if (input === '/') {
        output.push('/')
        break
      } else {
        output.push(input)
        break
      }
    } else if (len === 2) {
      if (input[0] === '.') {
        if (input[1] === '.') {
          break
        } else if (input[1] === '/') {
          input = input.slice(2)
          continue
        }
      } else if (input[0] === '/') {
        if (input[1] === '.') {
          output.push('/')
          break
        }
      }
    } else if (len === 3) {
      if (input === '/..') {
        if (output.length !== 0) {
          output.pop()
        }
        output.push('/')
        break
      }
    }
    if (input[0] === '.') {
      if (input[1] === '.') {
        if (input[2] === '/') {
          input = input.slice(3)
          continue
        }
      } else if (input[1] === '/') {
        input = input.slice(2)
        continue
      }
    } else if (input[0] === '/') {
      if (input[1] === '.') {
        if (input[2] === '/') {
          input = input.slice(2)
          continue
        } else if (input[2] === '.') {
          if (input[3] === '/') {
            input = input.slice(3)
            if (output.length !== 0) {
              output.pop()
            }
            continue
          }
        }
      }
    }

    // Rule 2E: Move normal path segment to output
    if ((nextSlash = input.indexOf('/', 1)) === -1) {
      output.push(input)
      break
    } else {
      output.push(input.slice(0, nextSlash))
      input = input.slice(nextSlash)
    }
  }

  return output.join('')
}

/**
 * Encodes a host according to the RFC 3986 host grammar. Valid IP literals
 * have already been checked by `normalizeIPv6`, so their address separators
 * remain literal. Every other host is a reg-name and may contain only
 * unreserved characters, sub-delimiters, and valid percent escapes.
 *
 * @param {string} host
 * @param {boolean} isIP - true for a validated IPv4/IPv6 host
 * @param {boolean} [allowNonAscii=false] - preserve non-ASCII IRI characters
 * @returns {string}
 */
const IP_HOST_DELIMS = { '@': '%40', '/': '%2F', '?': '%3F', '#': '%23' }
const IP_HOST_DELIM_RE = /[@/?#]/g

function encodeHost (host, isIP, allowNonAscii = false) {
  if (!isIP) {
    if (isLiteralRegName(host)) return host
    return encodeComponent(host, REG_NAME_TABLE, allowNonAscii)
  }

  IP_HOST_DELIM_RE.lastIndex = 0
  return host.replace(IP_HOST_DELIM_RE, (ch) => IP_HOST_DELIMS[ch])
}

/**
 * Normalizes percent escapes and optionally decodes only unreserved ASCII bytes.
 * Reserved delimiters such as `%2F` stay escaped; `%2E` is unreserved.
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
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        if (decodeUnreserved) {
          const value = HEX_DIGIT_VALUE[h1] * 16 + HEX_DIGIT_VALUE[h2]
          if (value < 128 && UNRESERVED_TABLE[value] === 1) {
            output += String.fromCharCode(value)
            i += 2
            continue
          }
        }
        output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        i += 2
        continue
      }
    }

    output += input[i]
  }

  return output
}

/** Pre-built `%XX` strings for every byte. Avoids per-call hex math/concat. */
const BYTE_HEX = new Array(256)
{
  const HEX_DIGITS = '0123456789ABCDEF'
  for (let i = 0; i < 256; i++) {
    BYTE_HEX[i] = '%' + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 0xF]
  }
}

/**
 * Mirrors the pass-through set of the deprecated `escape()` global:
 * `A-Z a-z 0-9 * + - . / @ _`. Keeps drop-in semantics for ASCII input.
 *
 * @param {number} cp
 * @returns {boolean}
 */
function isEscapeSafe (cp) {
  return (
    (cp >= 0x30 && cp <= 0x39) ||
    (cp >= 0x41 && cp <= 0x5A) ||
    (cp >= 0x61 && cp <= 0x7A) ||
    cp === 0x2A || cp === 0x2B || cp === 0x2D || cp === 0x2E ||
    cp === 0x2F || cp === 0x40 || cp === 0x5F
  )
}

/**
 * RFC 3986 percent-encode a non-ASCII Unicode code point as UTF-8 bytes.
 * Caller handles the ASCII branch inline for speed.
 *
 * @param {number} cp - Unicode code point (>= 0x80, <= 0x10FFFF)
 * @returns {string}
 */
function percentEncodeNonAscii (cp) {
  if (cp < 0x800) {
    return BYTE_HEX[0xC0 | (cp >> 6)] +
           BYTE_HEX[0x80 | (cp & 0x3F)]
  }
  if (cp < 0x10000) {
    return BYTE_HEX[0xE0 | (cp >> 12)] +
           BYTE_HEX[0x80 | ((cp >> 6) & 0x3F)] +
           BYTE_HEX[0x80 | (cp & 0x3F)]
  }
  return BYTE_HEX[0xF0 | (cp >> 18)] +
         BYTE_HEX[0x80 | ((cp >> 12) & 0x3F)] +
         BYTE_HEX[0x80 | ((cp >> 6) & 0x3F)] +
         BYTE_HEX[0x80 | (cp & 0x3F)]
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
  if (isLiteralPath(input)) {
    return input
  }

  let output = ''

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        const value = HEX_DIGIT_VALUE[h1] * 16 + HEX_DIGIT_VALUE[h2]

        if (value !== 46 && value < 128 && UNRESERVED_TABLE[value] === 1) { // 46 = '.'
          output += String.fromCharCode(value)
        } else {
          output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        }

        i += 2
        continue
      }
    }

    if (code < 128) {
      if (PATH_TABLE[code] === 1) {
        output += input[i]
      } else {
        output += isEscapeSafe(code) ? input[i] : BYTE_HEX[code]
      }
    } else if (code < 0xD800 || code > 0xDFFF) {
      output += percentEncodeNonAscii(code)
    } else if (code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        output += percentEncodeNonAscii(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00))
        i++
      } else {
        output += percentEncodeNonAscii(0xFFFD)
      }
    } else {
      output += percentEncodeNonAscii(0xFFFD)
    }
  }

  return output
}

/**
 * Serializes a path without rewriting reserved data. Raw RFC 3986 path
 * characters remain literal, valid escapes are preserved and uppercased, and
 * everything else is UTF-8 percent-encoded. In a path-noscheme, a colon in the
 * first segment must be escaped so the result cannot be parsed as a scheme.
 *
 * @param {string} input
 * @param {boolean} [pathNoScheme=false]
 * @returns {string}
 */
function serializePathEncoding (input, pathNoScheme = false) {
  if (!pathNoScheme && isLiteralPath(input)) {
    return input
  }

  let output = ''
  let firstSegment = pathNoScheme && input[0] !== '/'

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        i += 2
        continue
      }
    }

    if (code === 47) firstSegment = false // '/'

    if (code < 128) {
      if (PATH_TABLE[code] === 1 && (code !== 58 || !firstSegment)) { // 58 = ':'
        output += input[i]
      } else {
        output += BYTE_HEX[code]
      }
    } else if (code < 0xD800 || code > 0xDFFF) {
      output += percentEncodeNonAscii(code)
    } else if (code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        output += percentEncodeNonAscii(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00))
        i++
      } else {
        output += percentEncodeNonAscii(0xFFFD)
      }
    } else {
      output += percentEncodeNonAscii(0xFFFD)
    }
  }

  return output
}

/**
 * Normalizes the percent-encoding of a query or fragment component.
 *
 * Like `normalizePathEncoding`, but uses the query/fragment character set
 * (which additionally allows `?`) and decodes `.` since it has no dot-segment
 * meaning outside of a path.
 *
 * @param {string} input
 * @returns {string}
 */
function normalizeQueryFragmentEncoding (input) {
  if (isLiteralQueryFragment(input)) {
    return input
  }

  let output = ''

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        const value = HEX_DIGIT_VALUE[h1] * 16 + HEX_DIGIT_VALUE[h2]

        if (value < 128 && UNRESERVED_TABLE[value] === 1) {
          output += String.fromCharCode(value)
        } else {
          output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        }

        i += 2
        continue
      }
    }

    if (code < 128) {
      if (QUERY_FRAGMENT_TABLE[code] === 1) {
        output += input[i]
      } else {
        output += isEscapeSafe(code) ? input[i] : BYTE_HEX[code]
      }
    } else if (code < 0xD800 || code > 0xDFFF) {
      output += percentEncodeNonAscii(code)
    } else if (code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        output += percentEncodeNonAscii(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00))
        i++
      } else {
        output += percentEncodeNonAscii(0xFFFD)
      }
    } else {
      output += percentEncodeNonAscii(0xFFFD)
    }
  }

  return output
}

/**
 * Percent-encodes a URI component using its RFC 3986 literal character set.
 * Existing valid escapes are preserved and normalized to uppercase hex.
 *
 * @param {string} input
 * @param {Uint8Array} table - per-ASCII-code allow lookup for the set
 * @param {boolean} [allowNonAscii=false]
 * @returns {string}
 */
function encodeComponent (input, table, allowNonAscii = false) {
  let output = ''

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        i += 2
        continue
      }
    }

    if (code < 128) {
      if (table[code] === 1) {
        output += input[i]
      } else {
        output += BYTE_HEX[code]
      }
    } else if (code < 0xD800 || code > 0xDFFF) {
      output += allowNonAscii ? input[i] : percentEncodeNonAscii(code)
    } else if (code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        output += allowNonAscii
          ? input[i] + input[i + 1]
          : percentEncodeNonAscii(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00))
        i++
      } else {
        output += allowNonAscii ? '\uFFFD' : percentEncodeNonAscii(0xFFFD)
      }
    } else {
      output += allowNonAscii ? '\uFFFD' : percentEncodeNonAscii(0xFFFD)
    }
  }

  return output
}

/**
 * Encodes userinfo while preserving its RFC 3986 §3.2.1 literal characters.
 * In particular, authority delimiters such as `@`, `/`, `?`, and `#` are data.
 *
 * @param {string} input
 * @returns {string}
 */
function encodeUserinfo (input) {
  if (isLiteralUserinfo(input)) return input
  return encodeComponent(input, USERINFO_TABLE)
}

/**
 * Encodes query data using the RFC 3986 §3.4 grammar. A literal `#` must be
 * escaped because it would otherwise begin the fragment component.
 *
 * @param {string} input
 * @returns {string}
 */
function encodeQuery (input) {
  if (isLiteralQueryFragment(input)) return input
  return encodeComponent(input, QUERY_FRAGMENT_TABLE)
}

/**
 * Encodes fragment data using the RFC 3986 §3.5 grammar.
 *
 * @param {string} input
 * @returns {string}
 */
function encodeFragment (input) {
  if (isLiteralQueryFragment(input)) return input
  return encodeComponent(input, QUERY_FRAGMENT_TABLE)
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
    const code = input.charCodeAt(i)
    if (code === 37 && i + 2 < input.length) { // '%'
      const h1 = input.charCodeAt(i + 1)
      const h2 = input.charCodeAt(i + 2)
      if (h1 < 128 && h2 < 128 && HEX_DIGIT_TABLE[h1] === 1 && HEX_DIGIT_TABLE[h2] === 1) {
        output += '%' + HEX_UPPER_CHARS[h1] + HEX_UPPER_CHARS[h2]
        i += 2
        continue
      }
    }

    if (code < 128) {
      output += isEscapeSafe(code) ? input[i] : BYTE_HEX[code]
    } else if (code < 0xD800 || code > 0xDFFF) {
      output += percentEncodeNonAscii(code)
    } else if (code <= 0xDBFF && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        output += percentEncodeNonAscii(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00))
        i++
      } else {
        output += percentEncodeNonAscii(0xFFFD)
      }
    } else {
      output += percentEncodeNonAscii(0xFFFD)
    }
  }

  return output
}

/**
 * Rebuilds the bracketed form of a zoned IPv6 authority from the current
 * `component.host` and its zone identifier (`component.ipv6Zone`), but only
 * when they are consistent and describe a real zoned IPv6 literal that
 * normalizes back to `component.host`. This validates the zone on use, so a
 * caller-supplied `ipv6Zone` that does not match the host (or a host
 * reassigned after `parse`) is never trusted and recomposition falls back to
 * the normal path.
 *
 * @param {import('../types/index').URIComponent} component
 * @returns {string|undefined}
 */
function recomposeZonedIPv6Host (component) {
  const zone = component.ipv6Zone
  // Without an ipv6Zone the single-"%" host form is genuinely ambiguous when
  // the zone begins with "25", so we fall through to the best-effort heuristic
  // (which matches the pre-existing behavior for hand-built components that do
  // not carry a zone).
  if (zone === undefined) return undefined
  const host = component.host
  const separator = host.indexOf('%')
  if (separator === -1) return undefined
  const address = host.slice(0, separator)
  const escaped = address + '%25' + zone
  const derived = normalizeIPv6('[' + escaped + ']')
  if (derived.isIPV6 === true && derived.host === host) {
    return '[' + escaped + ']'
  }
  return undefined
}

/**
 * @param {import('../types/index').URIComponent} component
 * @param {boolean} [allowNonAscii=false] - preserve non-ASCII IRI characters
 * @returns {string|undefined}
 */
function recomposeAuthority (component, allowNonAscii = false) {
  const uriTokens = []

  if (component.userinfo !== undefined) {
    uriTokens.push(encodeUserinfo(component.userinfo))
    uriTokens.push('@')
  }

  if (component.host !== undefined) {
    let host = component.host
    if (!isIPv4(host)) {
      // A parse-time zone identifier is authoritative only while it still
      // describes the current host. Re-deriving an IPv6 zone from the
      // single-"%" component form is ambiguous when the zone begins with
      // "25": it is misread as a %25 separator, rewriting e.g. zone
      // "25eth0" into "eth0" (or destroying a zone of just "25"). A
      // validated zone keeps parse, normalize, serialize and equal in
      // agreement.
      const zonedHost = recomposeZonedIPv6Host(component)
      if (zonedHost !== undefined) {
        host = zonedHost
      } else {
        let ipV6res = normalizeIPv6(host)
        if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
          // Decode only unreserved bytes, once. In particular, keep %25
          // encoded so it cannot introduce a second escape during
          // recomposition.
          host = normalizePercentEncoding(host, true)
          ipV6res = normalizeIPv6(host)
        }
        if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) {
          host = `[${ipV6res.escapedHost}]`
        } else {
          host = encodeHost(host, false, allowNonAscii)
        }
      }
    }
    uriTokens.push(host)
  }

  if (typeof component.port === 'number' || typeof component.port === 'string') {
    const port = String(component.port)
    if (!isPort(port)) {
      throw new TypeError('URI port is malformed.')
    }
    uriTokens.push(':')
    uriTokens.push(port)
  }

  return uriTokens.length ? uriTokens.join('') : undefined
};

module.exports = {
  BYTE_HEX,
  percentEncodeNonAscii,
  nonSimpleDomain,
  nonSimpleMailtoDomain,
  fastLowerAsciiHost,
  recomposeAuthority,
  encodeHost,
  normalizePercentEncoding,
  normalizePathEncoding,
  serializePathEncoding,
  normalizeQueryFragmentEncoding,
  encodeUserinfo,
  encodeQuery,
  encodeFragment,
  escapePreservingEscapes,
  removeDotSegments,
  isIPv4,
  isUUID,
  normalizeIPv6,
  stringArrayToHexStripped
}

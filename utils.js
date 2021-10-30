function normalizeIPv4 (host) {
  if (findToken(host, '.') < 3) { return { host, isIPV4: false } }
  // regex not working properly. eg: ::ffff:195.164.2.2
  const matches = host.match(/^(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) || []
  const [address] = matches
  if (address) {
    return { host: stripLeadingZeros(address, '.', false), isIPV4: true }
  } else {
    return { host, isIPV4: false }
  }
}

function stringToHex (input) {
  const n = Number(`0x${input}`)
  if (Number.isNaN(n)) {
    return undefined
  } else {
    return n.toString(16)
  }
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
        const hex = stringToHex(buffer.join(''))
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
      // TODO: detect PCT encoded
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
      address.push(stringToHex(buffer.join('')))
    }
  }
  output.address = address.join('')
  return output
}

function normalizeIPv6 (host, opts = {}) {
  if (findToken(host, ':') < 2) { return { host, isIPV6: false } }
  const ipv6 = getIPV6(host, opts.isIPV4)

  if (!ipv6.error) {
    let newHost = ipv6.address
    if (ipv6.zone) {
      newHost += '%' + ipv6.zone
    }
    return { host: newHost, isIPV6: true }
  } else {
    return { host, isIPV6: false }
  }
}

function stripLeadingZeros (str, token, outputArray = false) {
  const outArray = []
  let out = ''
  let temp = ''
  let skip = true
  const l = str.length
  for (let i = 0; i < l; i++) {
    const c = str[i]
    if (c === '0' && skip) {
      if ((i + 1 <= l && str[i + 1] === token) || i + 1 === l) {
        if (outputArray) {
          temp += c
        } else {
          out += c
        }
        skip = false
      }
    } else {
      if (c === token) {
        skip = true
        if (temp.length) {
          outArray.push(temp)
          temp = ''
        }
      } else {
        skip = false
      }
      if (outputArray) {
        if (c !== token) {
          temp += c
        }
      } else {
        out += c
      }
    }
  }
  if (temp.length) {
    outArray.push(temp)
  }
  return outputArray ? outArray : out
}

function findToken (str, token) {
  let ind = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === token) {
      ind++
    }
  }
  return ind
}

const RDS1 = /^\.\.?\//
const RDS2 = /^\/\.(\/|$)/
const RDS3 = /^\/\.\.(\/|$)/
const RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/

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

// function hasReserved (str) {
//   const scope = [43, 122]
//   const rangeAlphas = [65, 90] // 'A'.charCodeAt(0), 'Z'.chartCodeAt(0)
//   const rangeLower = [97, 122] // 'a'.charCodeAt(0), 'z'.chartCodeAt(0)
//   const rangeDigit = [48, 57] // '0'.charCodeAt(0), '9'.chartCodeAt(0)
//   const tokens = [43, 45, 46] // '+'.charCodeAt(0), '-'.chartCodeAt(0), '.'.chartCodeAt(0)
//   let code
//   const idx = 0
//   while (idx < str.length) {
//     code = str.chartCodeAt()
//     if (code < scope[0] || code > scope[1]) {
//       return true
//     } else if (code >= rangeAlphas[0] || code <= rangeAlphas[1]) {
//       return true
//     } else if (code >= rangeLower[0] || code <= rangeLower[1]) {
//       return true
//     } else if (code >= rangeDigit[0] || code <= rangeDigit[1]) {
//       return true
//     } else if (tokens.includes[code]) {
//       return true
//     }
//   }
//   return false
// }

function normalizeComponentEncoding (components) {
  if(components.scheme !== undefined) {
    components.scheme = escape(components.scheme)
  } 
  if (components.userinfo !== undefined) {
    components.userinfo = escape(components.userinfo)
  }
  if (components.host !== undefined) {
    components.host = escape(components.host)
  }
  if (components.path !== undefined) {
    components.path = escape(components.path)
  }
  if (components.query !== undefined) {
    components.query = escape(components.query)
  }
  if (components.fragment !== undefined) {
    components.fragment = escape(components.fragment)
  }
  return components
}

function recomposeAuthority (components, options) {
  // const protocol = true // (options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL)
  const uriTokens = []

  if (components.userinfo !== undefined) {
    uriTokens.push(components.userinfo)
    uriTokens.push('@')
  }

  if (components.host !== undefined) {
    const ipV4res = normalizeIPv4(components.host)

    if (ipV4res.isIPV4) {
      uriTokens.push(ipV4res.host)
    } else {
      const ipV6res = normalizeIPv6(ipV4res.host, { isIPV4: false })
      if (ipV6res.isIPV6 === true) {
        uriTokens.push(`[${ipV6res.host}]`)
      } else {
        uriTokens.push(components.host)
      }
    }
    // normalize IP hosts, add brackets and escape zone separator for IPv6
    // uriTokens.push(normalizeIPv6(ipV4res.host,{isIPV4:ipV4res.isIPV4}, protocol).replace(protocol.IPV6ADDRESS, (_, $1, $2) => '[' + $1 + ($2 ? '%25' + $2 : '') + ']'))
  }

  if (typeof components.port === 'number' || typeof components.port === 'string') {
    uriTokens.push(':')
    uriTokens.push(String(components.port))
  }

  return uriTokens.length ? uriTokens.join('') : undefined
};

// function pctEncChar (chr) {
//   const c = chr.charCodeAt(0)
//   let e
//   if (c < 16) {
//     e = '%0' + c.toString(16).toUpperCase()
//   } else if (c < 128) {
//     e = '%' + c.toString(16).toUpperCase()
//   } else if (c < 2048) {
//     e = '%' + ((c >> 6) | 192).toString(16).toUpperCase() + '%' + ((c & 63) | 128).toString(16).toUpperCase()
//   } else {
//     e = '%' + ((c >> 12) | 224).toString(16).toUpperCase() + '%' + (((c >> 6) & 63) | 128).toString(16).toUpperCase() + '%' + ((c & 63) | 128).toString(16).toUpperCase()
//   }
//   return e
// }

function pctDecChars (str) {
  let newStr = ''
  let i = 0
  const il = str.length

  while (i < il) {
    const c = parseInt(str.substr(i + 1, 2), 16)

    if (c < 128) {
      newStr += String.fromCharCode(c)
      i += 3
    } else if (c >= 194 && c < 224) {
      if ((il - i) >= 6) {
        const c2 = parseInt(str.substr(i + 4, 2), 16)
        newStr += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
      } else {
        newStr += str.substr(i, 6)
      }
      i += 6
    } else if (c >= 224) {
      if ((il - i) >= 9) {
        const c2 = parseInt(str.substr(i + 4, 2), 16)
        const c3 = parseInt(str.substr(i + 7, 2), 16)
        newStr += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
      } else {
        newStr += str.substr(i, 9)
      }
      i += 9
    } else {
      newStr += str.substr(i, 3)
      i += 3
    }
  }

  return newStr
}

module.exports = {
  pctDecChars,
  recomposeAuthority,
  normalizeComponentEncoding,
  removeDotSegments,
  normalizeIPv4,
  normalizeIPv6
}

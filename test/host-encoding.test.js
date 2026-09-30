'use strict'

const test = require('tape')
const fastURI = require('..')

const C0_OR_SPACE = Array.from({ length: 0x21 }, (_, code) => String.fromCharCode(code))

function percentEncode (character) {
  return '%' + character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
}

test('host normalization percent-encodes interior C0 controls and spaces', (t) => {
  t.plan(C0_OR_SPACE.length * 3)

  for (const character of C0_OR_SPACE) {
    const input = `custom://a${character}b.example/path`
    const encodedHost = `a${percentEncode(character)}b.example`
    const expected = `custom://${encodedHost}/path`

    t.equal(fastURI.parse(input).host, encodedHost, `parse U+${percentEncode(character).slice(1)}`)
    t.equal(fastURI.normalize(input), expected, `normalize U+${percentEncode(character).slice(1)}`)
    t.equal(
      fastURI.resolve('custom://base.example/', `//a${character}b.example/path`),
      expected,
      `resolve U+${percentEncode(character).slice(1)}`
    )
  }
})

test('host serialization enforces the RFC 3986 reg-name grammar', (t) => {
  const forbidden = '"<>[\\]^`{|}\x7F:/?#@%'
  const expected = '%22%3C%3E%5B%5C%5D%5E%60%7B%7C%7D%7F%3A%2F%3F%23%40%25'

  t.equal(
    fastURI.serialize({ scheme: 'custom', host: forbidden, path: '/path' }),
    `custom://${expected}/path`,
    'forbidden ASCII host characters are percent-encoded'
  )
  t.equal(
    fastURI.serialize({ scheme: 'custom', host: "AZaz09-._~!$&'()*+,;=%2f" }),
    "custom://AZaz09-._~!$&'()*+,;=%2F",
    'unreserved characters, sub-delimiters, and valid escapes are preserved'
  )
  t.end()
})

test('host encoding preserves URI and IRI behavior', (t) => {
  const input = 'custom://résumé.example/path'
  const encoded = 'custom://r%C3%A9sum%C3%A9.example/path'

  t.equal(fastURI.normalize(input), encoded, 'URI host uses UTF-8 percent-encoding')
  t.equal(fastURI.normalize(input, { unicodeSupport: true }), input, 'IRI host preserves non-ASCII characters')
  t.equal(fastURI.normalize(encoded), encoded, 'encoded host normalization is idempotent')
  t.equal(
    fastURI.normalize('custom://safe\r\nevil.example/path'),
    'custom://safe%0D%0Aevil.example/path',
    'CRLF is not emitted literally'
  )
  t.end()
})

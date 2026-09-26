'use strict'

const test = require('tape')
const fastURI = require('..')

const EDGE_ERROR = 'URI must not contain leading or trailing C0 controls or spaces.'
const C0_OR_SPACE = Array.from({ length: 0x21 }, (_, code) => String.fromCharCode(code))

test('parse rejects leading and trailing C0 controls or spaces', (t) => {
  t.plan(C0_OR_SPACE.length * 2)

  for (const character of C0_OR_SPACE) {
    t.equal(fastURI.parse(character + 'relative').error, EDGE_ERROR, `leading U+${hex(character)}`)
    t.equal(fastURI.parse('relative' + character).error, EDGE_ERROR, `trailing U+${hex(character)}`)
  }
})

test('normalize preserves references with leading or trailing C0 controls or spaces', (t) => {
  t.plan(C0_OR_SPACE.length * 2)

  for (const character of C0_OR_SPACE) {
    const leading = character + '//evil.example/path'
    const trailing = '//evil.example/path' + character
    t.equal(fastURI.normalize(leading), leading, `leading U+${hex(character)}`)
    t.equal(fastURI.normalize(trailing), trailing, `trailing U+${hex(character)}`)
  }
})

test('equal rejects references with leading or trailing C0 controls or spaces', (t) => {
  t.plan(C0_OR_SPACE.length * 2)

  for (const character of C0_OR_SPACE) {
    const leading = character + 'relative'
    const trailing = 'relative' + character
    t.equal(fastURI.equal(leading, leading), false, `leading U+${hex(character)}`)
    t.equal(fastURI.equal(trailing, trailing), false, `trailing U+${hex(character)}`)
  }
})

test('resolve rejects leading and trailing C0 controls or spaces in either input', (t) => {
  t.plan(C0_OR_SPACE.length * 4)

  for (const character of C0_OR_SPACE) {
    t.throws(
      () => fastURI.resolve(character + 'http://base.example/', 'relative'),
      /leading or trailing C0 controls or spaces/,
      `leading base U+${hex(character)}`
    )
    t.throws(
      () => fastURI.resolve('http://base.example/' + character, 'relative'),
      /leading or trailing C0 controls or spaces/,
      `trailing base U+${hex(character)}`
    )
    t.throws(
      () => fastURI.resolve('http://base.example/', character + '//evil.example/path'),
      /URI (authority introducer must not contain whitespace|must not contain leading or trailing C0 controls or spaces)/,
      `leading relative U+${hex(character)}`
    )
    t.throws(
      () => fastURI.resolve('http://base.example/', '//evil.example/path' + character),
      /leading or trailing C0 controls or spaces/,
      `trailing relative U+${hex(character)}`
    )
  }
})

test('suffix parsing checks the original reference edges', (t) => {
  const options = { reference: 'suffix', scheme: 'http' }

  t.equal(fastURI.parse('\u0000example', options).error, EDGE_ERROR, 'leading edge before suffix prefixing')
  t.equal(fastURI.parse('example\u0020', options).error, EDGE_ERROR, 'trailing edge before suffix prefixing')
  t.equal(fastURI.normalize('\u0000example', options), '\u0000example', 'normalize preserves a malformed suffix')
  t.equal(fastURI.equal('example\u0020', 'example\u0020', options), false, 'equal rejects a malformed suffix')
  t.end()
})

test('interior and percent-encoded C0 controls or spaces remain data', (t) => {
  t.plan(C0_OR_SPACE.length * 6)

  for (const character of C0_OR_SPACE) {
    const encoded = percentEncode(character)
    const interior = 'a' + character + 'b'
    const leadingEncoded = encoded + '//evil.example/path'
    const trailingEncoded = '//evil.example/path' + encoded

    t.equal(fastURI.parse(interior).error, undefined, `interior U+${hex(character)}`)
    t.equal(fastURI.normalize(interior), 'a' + encoded + 'b', `normalize interior U+${hex(character)}`)
    t.equal(fastURI.parse(leadingEncoded).error, undefined, `encoded leading U+${hex(character)}`)
    t.equal(fastURI.normalize(leadingEncoded), leadingEncoded, `normalize encoded leading U+${hex(character)}`)
    t.equal(fastURI.parse(trailingEncoded).error, undefined, `encoded trailing U+${hex(character)}`)
    t.equal(fastURI.normalize(trailingEncoded), trailingEncoded, `normalize encoded trailing U+${hex(character)}`)
  }
})

test('structured component data remains trusted and is encoded', (t) => {
  t.equal(fastURI.serialize({ path: '\u0000' }), '%00', 'serialize encodes a path-edge control')
  t.equal(fastURI.normalize({ path: '\u0020' }).path, '%20', 'object normalization encodes a path-edge space')
  t.end()
})

test('resolve rejects an empty host for HTTP and HTTPS results', (t) => {
  const cases = [
    ['http://base.example/', '///evil.example'],
    ['https://base.example/', '////evil.example'],
    ['http://base.example/', '//'],
    ['http:///evil.example', ''],
    ['http://base.example/', '///evil.example', { scheme: 'null' }]
  ]

  t.plan(cases.length + 2)
  for (const [base, relative, options] of cases) {
    t.throws(
      () => fastURI.resolve(base, relative, options),
      /HTTP URIs must have a host/,
      `${base} + ${relative}`
    )
  }

  t.equal(
    fastURI.resolve('http://base.example/', '//other.example/path'),
    'http://other.example/path',
    'a non-empty HTTP authority remains valid'
  )
  t.equal(
    fastURI.resolve('uri://base.example/', '///path'),
    'uri:///path',
    'generic schemes may retain an empty authority'
  )
})

function hex (character) {
  return character.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
}

function percentEncode (character) {
  return '%' + character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
}

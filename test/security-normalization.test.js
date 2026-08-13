'use strict'

const test = require('tape')
const fastURI = require('..')

test('parse preserves reserved path escapes as data', (t) => {
  const components = fastURI.parse('http://example.com/a%2Fb/public/%2e%2e/admin')

  t.equal(components.path, '/a%2Fb/public/%2E%2E/admin')
  t.end()
})

test('normalize preserves percent-encoded path separators and dot segments', (t) => {
  t.equal(
    fastURI.normalize('http://example.com/public/%2e%2e/admin'),
    'http://example.com/public/%2E%2E/admin'
  )

  t.equal(
    fastURI.normalize('http://example.com/a%2Fb'),
    'http://example.com/a%2Fb'
  )

  t.end()
})

test('equal does not treat reserved path escapes as live path syntax', (t) => {
  t.equal(
    fastURI.equal('http://example.com/public/%2e%2e/admin', 'http://example.com/admin', {}),
    false
  )

  t.equal(
    fastURI.equal('http://example.com/a%2Fb', 'http://example.com/a/b', {}),
    false
  )

  t.end()
})

test('serialize preserves literal RFC 3986 reserved path characters', (t) => {
  // GHSA-7mh8-fcmq-x23c: literal reserved path chars must not be rewritten to
  // percent escapes by the escape()-style safe set.
  const cases = [
    'http://example.com/a;b',
    'http://example.com/a=b',
    'http://example.com/a&b',
    'http://example.com/a$b',
    'http://example.com/a:b',
    'http://example.com/a@b'
  ]

  t.plan(cases.length)

  cases.forEach((uri) => {
    t.equal(fastURI.serialize(fastURI.parse(uri)), uri, uri)
  })
  t.end()
})

test('serialize preserves existing reserved path escapes as data', (t) => {
  // GHSA-7mh8-fcmq-x23c: an existing %3A escape must stay %3A instead of being
  // rewritten into a live colon.
  const cases = [
    'http://example.com/a%3Ab',
    'http://example.com/a%3Bb',
    'http://example.com/a%3D%3D'
  ]

  t.plan(cases.length)

  cases.forEach((uri) => {
    t.equal(fastURI.serialize(fastURI.parse(uri)), uri, uri)
  })
  t.end()
})

test('serialize keeps path-noscheme colon escaping', (t) => {
  // Without a scheme a literal colon would be reparsed as a scheme separator,
  // so it must stay percent-escaped while an existing %3A is preserved.
  t.equal(fastURI.serialize({ path: 'foo:bar' }), 'foo%3Abar')
  t.equal(fastURI.serialize({ path: 'a%3Ab' }), 'a%3Ab')
  t.end()
})

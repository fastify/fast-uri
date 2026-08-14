'use strict'

const test = require('tape')
const fastURI = require('..')

const MALFORMED_SCHEME_ERROR = 'URI scheme is malformed.'

const malformedSchemes = [
  '%4Aavascript:1',
  '1http://example.com/',
  '+foo:value',
  '.foo:value',
  'foo_bar:value',
  'foo%2Bbar:value',
  'éxample:value',
  'Kttp://example.com/',
  'ſcheme:value',
  ':value'
]

test('parse accepts only the RFC 3986 scheme grammar', (t) => {
  const validSchemes = [
    ['a:value', 'a'],
    ['HTTP://example.com/', 'http'],
    ['a1+.-:value', 'a1+.-']
  ]

  for (const [uri, scheme] of validSchemes) {
    const parsed = fastURI.parse(uri)
    t.equal(parsed.error, undefined, uri)
    t.equal(parsed.scheme, scheme, uri + ' scheme')
  }

  for (const uri of malformedSchemes) {
    const parsed = fastURI.parse(uri)
    t.equal(parsed.error, MALFORMED_SCHEME_ERROR, uri)
    t.equal(parsed.scheme, undefined, uri + ' has no scheme')
  }
  t.end()
})

test('parse never percent-decodes a would-be scheme', (t) => {
  const parsed = fastURI.parse('%4Aavascript:1')

  t.equal(parsed.error, MALFORMED_SCHEME_ERROR, 'encoded first character is rejected')
  t.equal(parsed.scheme, undefined, 'encoded text does not become a scheme')
  t.end()
})

test('normalize preserves malformed scheme input unchanged', (t) => {
  for (const uri of malformedSchemes) {
    t.equal(fastURI.normalize(uri), uri, uri)
  }
  t.end()
})

test('equal returns false for malformed schemes', (t) => {
  t.equal(fastURI.equal('%4Aavascript:1', 'javascript:1'), false, 'encoded scheme differs from valid scheme')
  t.equal(fastURI.equal('1http://example.com/', '1http://example.com/'), false, 'malformed input is not equal to itself')
  t.end()
})

test('resolve rejects malformed schemes in either input', (t) => {
  t.throws(
    () => fastURI.resolve('1http://example.com/', 'child'),
    /URI scheme is malformed\./,
    'malformed base'
  )
  t.throws(
    () => fastURI.resolve('https://example.com/', '%4Aavascript:1'),
    /URI scheme is malformed\./,
    'malformed relative reference'
  )
  t.end()
})

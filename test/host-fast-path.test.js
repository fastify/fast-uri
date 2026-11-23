'use strict'

const test = require('tape')
const fastURI = require('..')
const { fastLowerAsciiHost, nonSimpleMailtoDomain } = require('../lib/utils')

// The host fast path may only skip `new URL('http://' + host)` when that call
// would return the ASCII-lowercased input. These tests pin the boundary of
// that decision. The exact IPv4 conversion is delegated to the platform WHATWG
// parser, so an expectation is derived from `new URL` in the running engine
// instead of being hard-coded: browsers do not agree on every edge form.

/**
 * The hostname the platform parser reports, or `undefined` when it rejects the
 * host. `new URL` throws in some engines where it returns a value in others.
 *
 * @param {string} host
 * @returns {string|undefined}
 */
function whatwgHost (host) {
  try {
    return new URL('http://' + host).hostname
  } catch {
    return undefined
  }
}

// Final labels that the WHATWG parser reads as an IPv4 number. A host of this
// shape must never take the fast path, because the conversion is not the
// identity.
const ipv4ShapedHosts = [
  '0x',
  '0X',
  '0x.',
  '0x.0x',
  '0x0',
  '0x7f',
  '0x7f.1',
  '0xff',
  '127.0.0.1.',
  '127.1',
  '1.2.3',
  '1.',
  '4294967295'
]

// Hosts that look numeric to a loose check but are plain names.
const plainNameHosts = [
  '0xg',
  'a.0x1z',
  'example.com.',
  '1..',
  '1...',
  'a.b.1c'
]

test('fastLowerAsciiHost declines every IPv4-shaped final label', (t) => {
  for (const host of ipv4ShapedHosts) {
    t.equal(fastLowerAsciiHost(host), undefined, `${host} does not take the fast path`)
    t.equal(nonSimpleMailtoDomain(host), true, `${host} uses the WHATWG parser for mailto`)
  }
  t.end()
})

test('fastLowerAsciiHost accepts a plain name whose last label is not a number', (t) => {
  for (const host of plainNameHosts) {
    t.equal(typeof fastLowerAsciiHost(host), 'string', `${host} takes the fast path`)
    t.equal(nonSimpleMailtoDomain(host), false, `${host} skips the WHATWG parser for mailto`)
  }
  t.end()
})

test('fastLowerAsciiHost agrees with the platform parser', (t) => {
  const hosts = [
    'example.com',
    'Example.COM',
    'mail2.example.org',
    'a.1.example',
    's3.amazonaws.com',
    '_dmarc.example.com',
    '-a.com',
    'a..b',
    ...[...ipv4ShapedHosts, ...plainNameHosts]
  ]

  for (const host of hosts) {
    const expected = whatwgHost(host)
    if (expected === undefined) continue
    const actual = fastLowerAsciiHost(host)
    if (actual === undefined) continue
    t.equal(actual, expected, `${host} matches new URL`)
  }
  t.end()
})

test('a host the fast path declines is converted by the WHATWG parser', (t) => {
  // The engine decides whether the conversion succeeds; what matters is that
  // fast-uri never silently keeps the unconverted label.
  for (const host of ipv4ShapedHosts) {
    const expected = whatwgHost(host)
    const input = 'http://' + host + '/'
    const parsed = fastURI.parse(input)
    const label = JSON.stringify(input)

    if (expected === undefined) {
      t.notEqual(parsed.error, undefined, `${label} reports the failed conversion`)
      t.equal(fastURI.normalize(input), input, `${label} is left unchanged`)
      t.equal(fastURI.equal(input, input), false, `${label} is not comparable`)
      continue
    }
    t.equal(parsed.error, undefined, `${label} converts without an error`)
    t.equal(parsed.host, expected, `${label} matches new URL`)
    t.equal(fastURI.normalize(input), 'http://' + expected + '/', `${label} normalizes like new URL`)
  }
  t.end()
})

test('an IPv4-shaped label inside a name fails closed on every engine', (t) => {
  // `a.0x` is rejected by every engine, so this is the engine-independent form
  // of the case where a fast path used to accept the host silently.
  t.equal(whatwgHost('a.0x'), undefined, 'the platform parser rejects a.0x')

  for (const host of ['a.0x', '.0x', 'a..0x']) {
    const parsed = fastURI.parse('http://' + host + '/')
    t.notEqual(parsed.error, undefined, `${host} reports an error`)
    t.equal(parsed.host, host, `${host} is preserved unchanged`)
  }
  t.throws(
    () => fastURI.resolve('http://a.0x/b', 'c'),
    /Host's domain name can not be converted to ASCII/u,
    'resolve reports the conversion failure'
  )
  t.end()
})

test('a numeric label that is not the host owner keeps the name', (t) => {
  t.equal(fastURI.normalize('http://a.1.example/'), 'http://a.1.example/', 'a non-final numeric label is a name')
  t.equal(fastURI.normalize('http://mail2.example.org/'), 'http://mail2.example.org/', 'a digit in a label is a name')
  t.equal(fastURI.normalize('http://example.com./'), 'http://example.com./', 'a trailing dot on a name is kept')
  t.equal(fastURI.normalize('http://1../'), 'http://1../', 'two trailing dots are not one')
  t.end()
})

test('host fast path keeps non-ASCII and escaped hosts correct', (t) => {
  t.equal(fastURI.normalize('x://résumé.example/'), 'x://r%C3%A9sum%C3%A9.example/', 'a non-ASCII reg-name is percent-encoded')
  t.equal(fastURI.normalize('http://résumé.example/'), 'http://xn--rsum-bpad.example/', 'a non-ASCII domain host is converted to ASCII')
  t.equal(fastURI.normalize('http://%41.com/'), 'http://a.com/', 'an unreserved escape is decoded')
  t.equal(fastURI.normalize('http://%256cocalhost/'), 'http://%256cocalhost/', 'a nested escape is not decoded twice')
  t.end()
})

test('mailto domains follow the platform IPv4 conversion', (t) => {
  for (const host of ['0x', '0x0', '0x7f', '1.', '1..', 'mail2.example.org', 'a.0x10']) {
    const expected = whatwgHost(host)
    const parsed = fastURI.parse('mailto:user@' + host)
    const label = 'mailto:user@' + host

    if (expected === undefined) {
      t.equal(parsed.error, 'URI mailto has an invalid recipient domain.', `${label} reports the invalid domain`)
      t.deepEqual(parsed.to, ['user@' + host], `${label} preserves the recipient`)
      continue
    }
    t.equal(parsed.error, undefined, `${label} converts without an error`)
    t.deepEqual(parsed.to, ['user@' + expected], `${label} matches new URL`)
  }
  t.end()
})

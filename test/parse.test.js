'use strict'

const test = require('tape')
const fastURI = require('..')

test('URI parse', (t) => {
  let components

  // scheme
  components = fastURI.parse('uri:')
  t.equal(components.error, undefined, 'scheme errors')
  t.equal(components.scheme, 'uri', 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // userinfo
  components = fastURI.parse('//@')
  t.equal(components.error, undefined, 'userinfo errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, "@", "authority");
  t.equal(components.userinfo, '', 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // host
  components = fastURI.parse('//')
  t.equal(components.error, undefined, 'host errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, "", "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // port
  components = fastURI.parse('//:')
  t.equal(components.error, undefined, 'port errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, ":", "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, '', 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // path
  components = fastURI.parse('')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // query
  components = fastURI.parse('?')
  t.equal(components.error, undefined, 'query errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, '', 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // fragment
  components = fastURI.parse('#')
  t.equal(components.error, undefined, 'fragment errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '', 'fragment')

  // fragment with character tabulation
  components = fastURI.parse('#\t')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%09', 'fragment')

  // fragment with line feed
  components = fastURI.parse('#\n')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0A', 'fragment')

  // fragment with line tabulation
  components = fastURI.parse('#\v')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0B', 'fragment')

  // fragment with form feed
  components = fastURI.parse('#\f')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0C', 'fragment')

  // fragment with carriage return
  components = fastURI.parse('#\r')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0D', 'fragment')

  // a fragment whose decoded bytes are not valid UTF-8 is still valid
  // percent-encoding (RFC 3986 §2.1 is byte-level), so it is preserved as-is
  // rather than being flagged as malformed
  components = fastURI.parse('http://example.com/#%E0%A4A')
  t.equal(components.error, undefined, 'valid percent-encoding is not flagged as malformed')
  t.equal(components.fragment, '%E0%A4A', 'fragment is preserved')

  // all
  components = fastURI.parse('uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body')
  t.equal(components.error, undefined, 'all errors')
  t.equal(components.scheme, 'uri', 'scheme')
  // t.equal(components.authority, "user:pass@example.com:123", "authority");
  t.equal(components.userinfo, 'user:pass', 'userinfo')
  t.equal(components.host, 'example.com', 'host')
  t.equal(components.port, 123, 'port')
  t.equal(components.path, '/one/two.three', 'path')
  t.equal(components.query, 'q1=a1&q2=a2', 'query')
  t.equal(components.fragment, 'body', 'fragment')

  // IPv4address
  components = fastURI.parse('//10.10.10.10')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.10.10', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv4address with unformated 0 stay as-is
  components = fastURI.parse('//10.10.000.10') // not valid as per https://datatracker.ietf.org/doc/html/rfc5954#section-4.1
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.000.10', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')
  components = fastURI.parse('//01.01.01.01') // not valid in URIs: https://datatracker.ietf.org/doc/html/rfc3986#section-7.4
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '01.01.01.01', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address
  components = fastURI.parse('//[2001:db8::7]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::7', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // invalid IPv6
  components = fastURI.parse('//[2001:dbZ::7]')
  t.equal(components.host, '[2001:dbz::7]')
  t.equal(components.error, 'URI host is malformed.')

  // mixed IPv4address & IPv6address
  components = fastURI.parse('//[::ffff:129.144.52.38]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '::ffff:129.144.52.38', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
  components = fastURI.parse('uri://10.10.10.10.example.com/en/process')
  t.equal(components.error, undefined, 'mixed errors')
  t.equal(components.scheme, 'uri', 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.10.10.example.com', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '/en/process', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address, example from bkw (https://github.com/garycourt/uri-js/pull/16)
  components = fastURI.parse('//[2606:2800:220:1:248:1893:25c8:1946]/test')
  t.equal(components.error, undefined, 'IPv6address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2606:2800:220:1:248:1893:25c8:1946', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '/test', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address, example from RFC 5952
  components = fastURI.parse('//[2001:db8::1]:80')
  t.equal(components.error, undefined, 'IPv6address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::1', 'host')
  t.equal(components.port, 80, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address with zone identifier, RFC 6874
  components = fastURI.parse('//[fe80::a%25en1]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, 'fe80::a%en1', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address with an unescaped interface specifier, example from pekkanikander (https://github.com/garycourt/uri-js/pull/22)
  components = fastURI.parse('//[2001:db8::7%en0]')
  t.equal(components.error, undefined, 'IPv6address interface errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::7%en0', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // UUID V1
  components = fastURI.parse('urn:uuid:b571b0bc-4713-11ec-81d3-0242ac130003')
  t.equal(components.error, undefined, 'errors')
  t.equal(components.scheme, 'urn', 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, undefined, 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')
  t.equal(components.nid, 'uuid', 'nid')
  t.equal(components.nss, undefined, 'nss')
  t.equal(components.uuid, 'b571b0bc-4713-11ec-81d3-0242ac130003', 'uuid')

  // UUID v4
  components = fastURI.parse('urn:uuid:97a32222-89b7-420e-8507-4360723e2c2a')
  t.equal(components.uuid, '97a32222-89b7-420e-8507-4360723e2c2a', 'uuid')

  components = fastURI.parse('urn:uuid:notauuid-7dec-11d0-a765-00a0c91e6bf6')
  t.notSame(components.error, undefined, 'errors')

  components = fastURI.parse('urn:foo:a123,456')
  t.equal(components.error, undefined, 'errors')
  t.equal(components.scheme, 'urn', 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, undefined, 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')
  t.equal(components.nid, 'foo', 'nid')
  t.equal(components.nss, 'a123,456', 'nss')

  components = fastURI.parse('//[2606:2800:220:1:248:1893:25c8:1946:43209]')
  t.equal(components.host, '[2606:2800:220:1:248:1893:25c8:1946:43209]')
  t.equal(components.error, 'URI host is malformed.')

  components = fastURI.parse('urn:foo:|\\24fpl')
  t.equal(components.error, 'URN can not be parsed.')
  t.end()
})

test('Mailto parsing normalizes Unicode domains according to options', (t) => {
  t.deepEqual(
    fastURI.parse('mailto:user@納豆.example.org').to,
    ['user@xn--99zt52a.example.org'],
    'Unicode domain defaults to ASCII'
  )
  t.deepEqual(
    fastURI.parse('mailto:user@納豆.example.org', { unicodeSupport: true }).to,
    ['user@納豆.example.org'],
    'Unicode domain is preserved when requested'
  )
  t.deepEqual(
    fastURI.parse('mailto:user@xn--99zt52a.example.org', { unicodeSupport: true }).to,
    ['user@xn--99zt52a.example.org'],
    'existing punycode remains unchanged in Unicode mode'
  )
  t.end()
})

test('Mailto parsing preserves and reports malformed recipient domains', (t) => {
  const cases = [
    ['mailto:user@example.org:25', 'user@example.org:25'],
    ['mailto:user@example.org/path', 'user@example.org/path'],
    ['mailto:user@example.org%40evil.test', 'user@example.org@evil.test'],
    ['mailto:user@example.org%3Fquery', 'user@example.org?query'],
    ['mailto:user@example.org%23fragment', 'user@example.org#fragment'],
    ['mailto:user@[broken', 'user@[broken'],
    ['mailto:user', 'user']
  ]

  for (const [uri, recipient] of cases) {
    const parsed = fastURI.parse(uri)
    t.equal(parsed.error, 'URI mailto has an invalid recipient domain.', 'error for ' + uri)
    t.deepEqual(parsed.to, [recipient], 'recipient is preserved for ' + uri)
  }
  t.end()
})

test('Mailto parsing handles domain literals, empty queries, and malformed headers', (t) => {
  const literal = fastURI.parse('mailto:user@[IPv6:2001:db8::1]')
  t.equal(literal.error, undefined, 'valid domain literal has no error')
  t.deepEqual(literal.to, ['user@[ipv6:2001:db8::1]'], 'domain literal is preserved')

  const emptyQuery = fastURI.parse('mailto:user@example.org?')
  t.equal(emptyQuery.query, undefined, 'empty query is cleared')
  t.equal(emptyQuery.headers, undefined, 'empty query does not create a header')

  const malformedHeaders = fastURI.parse('mailto:joe@example.com?cc=bob@example.com?body=hello')
  t.equal(malformedHeaders.error, 'URI mailto has malformed header fields.', 'malformed fields set an error')
  t.deepEqual(malformedHeaders.to, ['joe@example.com'], 'path recipient is retained')
  t.end()
})

test('Mailto parsing folds lone surrogates in raw input', (t) => {
  // The handler sets `skipNormalize`, so it must fold lone surrogates itself --
  // the generic query/path normalizers no longer run to do it.
  const lone = '\uD800'
  const trailing = '\uDC00'

  t.deepEqual(
    // spread: `headers` has a null prototype, which t.deepEqual compares strictly
    { ...fastURI.parse('mailto:a@b.test?x=' + lone).headers },
    { x: '�' },
    'lone high surrogate in a header value becomes U+FFFD'
  )
  t.equal(
    fastURI.parse('mailto:a@b.test?subject=' + trailing).subject,
    '�',
    'lone low surrogate in a subject becomes U+FFFD'
  )
  t.deepEqual(
    fastURI.parse('mailto:' + lone + '@b.test').to,
    ['�@b.test'],
    'lone surrogate in a local part becomes U+FFFD'
  )
  t.deepEqual(
    fastURI.parse('mailto:a@b.test?subject=😀').subject,
    '😀',
    'a valid surrogate pair is left intact'
  )
  t.end()
})

test('Mailto domain fast path agrees with the WHATWG parser', (t) => {
  // `mailtoNormalizeDomain` skips `new URL` when `nonSimpleMailtoDomain` is
  // false. Every domain here must come out the same either way -- especially the
  // all-numeric last labels, which `new URL` reads as IPv4 shorthand.
  const domains = [
    'example.com',
    'example.org',
    'mail2.example.org',
    's3.amazonaws.com',
    'ex4mple.com',
    '_dmarc.example.com',
    '-a.com',
    'a..b',
    'a.com.',
    '1.2.3',
    '127.1',
    '12',
    '0x7f.1',
    '9.9.9.9',
    '1.2.3.4'
  ]

  for (const domain of domains) {
    const parsed = fastURI.parse('mailto:user@' + domain)
    let expected
    try {
      const url = new URL('http://' + domain)
      const invalid = url.username || url.password || url.port ||
        url.pathname !== '/' || url.search || url.hash || !url.hostname
      expected = invalid ? domain : url.hostname
    } catch {
      expected = domain
    }
    t.deepEqual(parsed.to, ['user@' + expected], 'matches new URL for ' + domain)
  }

  // The fast path must not be taken for a domain whose last label is numeric.
  t.deepEqual(fastURI.parse('mailto:user@1.2.3').to, ['user@1.2.0.3'], 'IPv4 shorthand is still applied')
  t.deepEqual(fastURI.parse('mailto:user@mail2.example.org').to, ['user@mail2.example.org'], 'digits stay on the fast path')
  t.end()
})

test('Mailto headers use a null prototype', (t) => {
  // Header names come from untrusted input, so a lookup must not resolve to an
  // inherited member of Object.prototype.
  const parsed = fastURI.parse('mailto:a@b.test?blat=foop')
  t.equal(Object.getPrototypeOf(parsed.headers), null, 'headers has no prototype')
  t.equal(parsed.headers.toString, undefined, 'inherited members do not leak')
  t.equal(parsed.headers.constructor, undefined, 'constructor does not leak')

  // With a null prototype "__proto__" is an ordinary key rather than a setter,
  // so it round-trips instead of being silently discarded.
  const polluted = fastURI.parse('mailto:a@b.test?__proto__=x')
  t.deepEqual(Object.keys(polluted.headers), ['__proto__'], '__proto__ is kept as an own key')
  t.equal(fastURI.serialize(polluted), 'mailto:a@b.test?__proto__=x', '__proto__ round-trips')
  t.equal({}.x, undefined, 'Object.prototype is not polluted')
  t.equal(Object.getPrototypeOf({}), Object.prototype, 'Object.prototype is intact')
  t.end()
})

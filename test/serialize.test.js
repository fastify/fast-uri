'use strict'

const test = require('tape')
const fastURI = require('..')

test('URI Serialize', (t) => {
  let components = {
    scheme: undefined,
    userinfo: undefined,
    host: undefined,
    port: undefined,
    path: undefined,
    query: undefined,
    fragment: undefined
  }
  t.equal(fastURI.serialize(components), '', 'Undefined Components')

  components = {
    scheme: '',
    userinfo: '',
    host: '',
    port: 0,
    path: '',
    query: '',
    fragment: ''
  }
  t.equal(fastURI.serialize(components), '//@:0?#', 'Empty Components')

  components = {
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  }
  t.equal(fastURI.serialize(components), 'uri://foo:bar@example.com:1/path?query#fragment', 'All Components')

  components = {
    scheme: 'uri',
    host: 'example.com',
    port: '9000'
  }
  t.equal(fastURI.serialize(components), 'uri://example.com:9000', 'String port')

  t.equal(fastURI.serialize({ path: '//path' }), '/%2Fpath', 'Double slash path')
  t.equal(fastURI.serialize({ path: 'foo:bar' }), 'foo%3Abar', 'Colon path')
  t.equal(fastURI.serialize({ path: '?query' }), '%3Fquery', 'Query path')

  t.equal(fastURI.serialize({ host: '10.10.10.10' }), '//10.10.10.10', 'IPv4address')

  // mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
  t.equal(fastURI.serialize({ host: '10.10.10.10.example.com' }), '//10.10.10.10.example.com', 'Mixed IPv4address & reg-name')

  // IPv6address
  t.equal(fastURI.serialize({ host: '2001:db8::7' }), '//[2001:db8::7]', 'IPv6 Host')
  t.equal(fastURI.serialize({ host: '::ffff:129.144.52.38' }), '//[::ffff:129.144.52.38]', 'IPv6 Mixed Host')
  t.equal(fastURI.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' }), '//[2606:2800:220:1:248:1893:25c8:1946]', 'IPv6 Full Host')

  // IPv6address with zone identifier, RFC 6874
  t.equal(fastURI.serialize({ host: 'fe80::a%en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Unescaped Host')
  t.equal(fastURI.serialize({ host: 'fe80::a%25en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Escaped Host')

  t.end()
})

test('WS serialize', (t) => {
  t.equal(fastURI.serialize({ scheme: 'ws' }), 'ws:')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com' }), 'ws://example.com')
  t.equal(fastURI.serialize({ scheme: 'ws', resourceName: '/' }), 'ws:')
  t.equal(fastURI.serialize({ scheme: 'ws', resourceName: '/foo' }), 'ws:/foo')
  t.equal(fastURI.serialize({ scheme: 'ws', resourceName: '/foo?bar' }), 'ws:/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'ws', secure: false }), 'ws:')
  t.equal(fastURI.serialize({ scheme: 'ws', secure: true }), 'wss:')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo' }), 'ws://example.com/foo')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar' }), 'ws://example.com/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', secure: false }), 'ws://example.com')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', secure: true }), 'wss://example.com')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: false }), 'ws://example.com/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true }), 'wss://example.com/foo?bar')
  t.end()
})

test('WSS serialize', (t) => {
  t.equal(fastURI.serialize({ scheme: 'wss' }), 'wss:')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com' }), 'wss://example.com')
  t.equal(fastURI.serialize({ scheme: 'wss', resourceName: '/' }), 'wss:')
  t.equal(fastURI.serialize({ scheme: 'wss', resourceName: '/foo' }), 'wss:/foo')
  t.equal(fastURI.serialize({ scheme: 'wss', resourceName: '/foo?bar' }), 'wss:/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'wss', secure: false }), 'ws:')
  t.equal(fastURI.serialize({ scheme: 'wss', secure: true }), 'wss:')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo' }), 'wss://example.com/foo')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar' }), 'wss://example.com/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', secure: false }), 'ws://example.com')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', secure: true }), 'wss://example.com')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar', secure: false }), 'ws://example.com/foo?bar')
  t.equal(fastURI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar', secure: true }), 'wss://example.com/foo?bar')

  t.end()
})

test('URN serialize', (t) => {
  // example from RFC 2141
  const components = {
    scheme: 'urn',
    nid: 'foo',
    nss: 'a123,456'
  }
  t.equal(fastURI.serialize(components), 'urn:foo:a123,456')
  // example from RFC 4122
  let uuidcomponents = {
    scheme: 'urn',
    nid: 'uuid',
    uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
  }
  t.equal(fastURI.serialize(uuidcomponents), 'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6')

  uuidcomponents = {
    scheme: 'urn',
    nid: 'uuid',
    uuid: 'notauuid-7dec-11d0-a765-00a0c91e6bf6'
  }
  t.equal(fastURI.serialize(uuidcomponents), 'urn:uuid:notauuid-7dec-11d0-a765-00a0c91e6bf6')

  uuidcomponents = {
    scheme: 'urn',
    nid: undefined,
    uuid: 'notauuid-7dec-11d0-a765-00a0c91e6bf6'
  }
  t.throws(() => { fastURI.serialize(uuidcomponents) }, 'URN without nid cannot be serialized')

  t.end()
})
test('URN NID Override', (t) => {
  let components = fastURI.parse('urn:foo:f81d4fae-7dec-11d0-a765-00a0c91e6bf6', { nid: 'uuid' })
  t.equal(components.error, undefined, 'errors')
  t.equal(components.scheme, 'urn', 'scheme')
  t.equal(components.path, undefined, 'path')
  t.equal(components.nid, 'foo', 'nid')
  t.equal(components.nss, undefined, 'nss')
  t.equal(components.uuid, 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', 'uuid')

  components = {
    scheme: 'urn',
    nid: 'foo',
    uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
  }
  t.equal(fastURI.serialize(components, { nid: 'uuid' }), 'urn:foo:f81d4fae-7dec-11d0-a765-00a0c91e6bf6')
  t.end()
})

test('Mailto serialization preserves delimiters, escapes, and input state', (t) => {
  const valueComponent = {
    scheme: 'mailto',
    to: ['user@example.org'],
    headers: { x: 'a&b' }
  }
  const valueURI = fastURI.serialize(valueComponent)
  t.equal(valueURI, 'mailto:user@example.org?x=a%26b', 'ampersand in header value is encoded')
  // spread: `headers` has a null prototype, which t.deepEqual compares strictly
  t.deepEqual({ ...fastURI.parse(valueURI).headers }, { x: 'a&b' }, 'header value round-trips')

  const nameComponent = {
    scheme: 'mailto',
    to: ['user@example.org'],
    headers: { 'x&y': 'z' }
  }
  const nameURI = fastURI.serialize(nameComponent)
  t.equal(nameURI, 'mailto:user@example.org?x%26y=z', 'ampersand in header name is encoded')
  t.deepEqual({ ...fastURI.parse(nameURI).headers }, { 'x&y': 'z' }, 'header name round-trips')

  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], subject: 'a%2fb' }),
    'mailto:user@example.org?subject=a%2Fb',
    'valid percent escape is preserved and uppercased'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], subject: 'a%GGb' }),
    'mailto:user@example.org?subject=a%25GGb',
    'malformed percent escape is encoded'
  )

  const immutableComponent = {
    scheme: 'mailto',
    to: ['café@EXAMPLE.ORG'],
    subject: 'hello',
    headers: { cc: 'other@example.org' }
  }
  const expected = JSON.parse(JSON.stringify(immutableComponent))
  fastURI.serialize(immutableComponent)
  t.deepEqual(immutableComponent, expected, 'recipient and header containers are not mutated')
  t.end()
})

test('Mailto serialization does not let recipient data inject URI structure', (t) => {
  // A recipient domain must never reach the output with a delimiter intact:
  // "?" would inject header fields and "#" a fragment.
  const cases = [
    ['user@example.org?subject=Injected', 'mailto:user@example.org%3Fsubject%3Dinjected'],
    ['user@example.org#frag', 'mailto:user@example.org%23frag'],
    // domain literals accept the full RFC 5321 dcontent range, which includes "?"
    ['user@[x?subject=Injected]', 'mailto:user@[x%3Fsubject%3Dinjected]'],
    // "," is the recipient delimiter, so it must be encoded inside an address
    ['a,b@example.org', 'mailto:a%2Cb@example.org']
  ]

  for (const [recipient, expected] of cases) {
    const uri = fastURI.serialize({ scheme: 'mailto', to: [recipient] })
    t.equal(uri, expected, 'encodes delimiters in ' + recipient)
    const reparsed = fastURI.parse(uri)
    t.deepEqual(reparsed.to, [recipient.toLowerCase()], 'round-trips ' + recipient)
    t.equal(reparsed.subject, undefined, 'no subject injected by ' + recipient)
    t.equal(reparsed.headers, undefined, 'no headers injected by ' + recipient)
    t.equal(reparsed.fragment, undefined, 'no fragment injected by ' + recipient)
  }

  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['a@x.test', 'b@y.test'] }),
    'mailto:a@x.test,b@y.test',
    'the joining comma between recipients stays literal'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@[IPv6:2001:db8::1]'] }),
    'mailto:user@[ipv6:2001:db8::1]',
    'a valid domain literal keeps its delimiters'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@納豆.example.org'] }),
    'mailto:user@xn--99zt52a.example.org',
    'Unicode domain is still converted to ASCII'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@納豆.example.org'] }, { unicodeSupport: true }),
    'mailto:user@納豆.example.org',
    'Unicode domain is still preserved when requested'
  )
  t.end()
})

test('Mailto encoding is consistent across the fast/slow path boundary', (t) => {
  // The encoder returns the input untouched when every character is allowed,
  // and only then falls back to the per-character loop. Both branches must
  // agree on what needs escaping.
  const base = { scheme: 'mailto', to: ['user@example.org'] }

  t.equal(
    fastURI.serialize({ ...base, headers: { 'In-Reply-To': 'plain-value' } }),
    'mailto:user@example.org?In-Reply-To=plain-value',
    'fully allowed name and value are emitted verbatim'
  )
  t.equal(
    fastURI.serialize({ ...base, headers: { 'x y': '<a>&b c' } }),
    'mailto:user@example.org?x%20y=%3Ca%3E%26b%20c',
    'disallowed characters are escaped in both name and value'
  )
  t.equal(
    fastURI.serialize({ ...base, body: 'send current-issue\r\nsend index' }),
    'mailto:user@example.org?body=send%20current-issue%0D%0Asend%20index',
    'space and CRLF are escaped in a body'
  )
  t.equal(
    fastURI.serialize({ ...base, subject: 'a%2fb%GGc' }),
    'mailto:user@example.org?subject=a%2Fb%25GGc',
    'valid escapes are uppercased and invalid ones escaped in one pass'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['a.b-c_d~e!f@example.org'] }),
    'mailto:a.b-c_d~e!f@example.org',
    'an entirely allowed local part takes the fast path unchanged'
  )
  t.end()
})

test('Mailto serialization ignores a caller-supplied path', (t) => {
  // `to` is the only recipient source. A raw path has not been through this
  // handler's encoder, and the handler sets `skipEscape`, so emitting it would
  // put unescaped data (including CR/LF) straight into the URI.
  t.equal(
    fastURI.serialize({ scheme: 'mailto', path: 'a@b.test\r\nBcc: evil@evil.test' }),
    'mailto:',
    'a path containing CRLF is dropped, not emitted raw'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', path: 'user@example.org?subject=Injected' }),
    'mailto:',
    'a path containing header fields is dropped'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['a@b.test'], path: 'ignored?x=1' }),
    'mailto:a@b.test',
    'a path is ignored when recipients are present'
  )
  t.end()
})

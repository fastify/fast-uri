'use strict'

const test = require('tape')
const fastURI = require('..')

test('Mailto scheme is registered', (t) => {
  t.ok(fastURI.SCHEMES.mailto, 'SCHEMES.mailto is present')
  t.equal(fastURI.SCHEMES.mailto.scheme, 'mailto', 'scheme name')
  t.equal(typeof fastURI.SCHEMES.mailto.parse, 'function', 'parse fn')
  t.equal(typeof fastURI.SCHEMES.mailto.serialize, 'function', 'serialize fn')
  t.end()
})

test('Mailto parse: bare address', (t) => {
  const c = fastURI.parse('mailto:chris@example.com')
  t.equal(c.error, undefined, 'no error')
  t.equal(c.scheme, 'mailto', 'scheme')
  t.equal(c.path, undefined, 'path is cleared')
  t.equal(c.query, undefined, 'query is cleared')
  t.equal(c.fragment, undefined, 'no fragment')
  t.deepEqual(c.to, ['chris@example.com'], 'to')
  t.equal(c.subject, undefined, 'no subject')
  t.equal(c.body, undefined, 'no body')
  t.equal(c.headers, undefined, 'no headers')
  t.end()
})

test('Mailto parse: subject and body decoding', (t) => {
  let c
  c = fastURI.parse('mailto:infobot@example.com?subject=current-issue')
  t.equal(c.subject, 'current-issue', 'subject literal')
  t.equal(c.body, undefined, 'no body')

  c = fastURI.parse('mailto:infobot@example.com?body=send%20current-issue')
  t.equal(c.body, 'send current-issue', 'body %20 -> space')

  c = fastURI.parse('mailto:infobot@example.com?body=send%20current-issue%0D%0Asend%20index')
  t.equal(c.body, 'send current-issue\r\nsend index', 'body %0D%0A -> CRLF')

  c = fastURI.parse('mailto:user@example.org?subject=caf%C3%A9&body=caf%C3%A9')
  t.equal(c.subject, 'café', 'subject UTF-8 percent-decoded')
  t.equal(c.body, 'café', 'body UTF-8 percent-decoded')
  t.end()
})

test('Mailto parse: unknown headers collected in headers map', (t) => {
  const c = fastURI.parse(
    'mailto:list@example.org?In-Reply-To=%3C3469A91.D10AF4C@example.com%3E'
  )
  t.deepEqual(c.headers, { 'In-Reply-To': '<3469A91.D10AF4C@example.com>' },
    'unknown header name and value both percent-decoded')

  const c2 = fastURI.parse(
    'mailto:joe@example.com?cc=bob@example.com&body=hello'
  )
  t.equal(c2.body, 'hello', 'body lifted to top-level')
  t.deepEqual(c2.headers, { cc: 'bob@example.com' }, 'cc collected in headers')
  t.end()
})

test('Mailto parse: multiple recipients', (t) => {
  const c = fastURI.parse('mailto:addr1@an.example,addr2@an.example')
  t.deepEqual(c.to, ['addr1@an.example', 'addr2@an.example'],
    'comma-separated path recipients')

  const c2 = fastURI.parse('mailto:?to=addr1@an.example,addr2@an.example')
  t.deepEqual(c2.to, ['addr1@an.example', 'addr2@an.example'],
    '?to= query recipients')
  t.end()
})

test('Mailto parse: encoded local parts', (t) => {
  t.deepEqual(fastURI.parse('mailto:gorby%25kremvax@example.com').to,
    ['gorby%kremvax@example.com'], '%25 -> %')
  t.deepEqual(fastURI.parse('mailto:unlikely%3Faddress@example.com?blat=foop').to,
    ['unlikely?address@example.com'], '%3F -> ?')
  t.deepEqual(fastURI.parse('mailto:Mike%26family@example.org').to,
    ['Mike&family@example.org'], '%26 -> &')
  t.deepEqual(fastURI.parse('mailto:%22not%40me%22@example.org').to,
    ['"not@me"@example.org'], '%22%40 -> "@')
  t.deepEqual(fastURI.parse('mailto:%22oh%5C%5Cno%22@example.org').to,
    ['"oh\\\\no"@example.org'], '%5C -> \\')
  t.end()
})

test('Mailto parse: RFC 2047 strings preserved verbatim', (t) => {
  const c = fastURI.parse(
    'mailto:user@example.org?subject=%3D%3Futf-8%3FQ%3Fcaf%3DC3%3DA9%3F%3D'
  )
  t.equal(c.subject, '=?utf-8?Q?caf=C3=A9?=', 'RFC 2047 left literal')
  t.end()
})

test('Mailto parse: strict validation on multiple = in hfield', (t) => {
  const c = fastURI.parse('mailto:joe@example.com?cc=bob@example.com?body=hello')
  t.equal(c.error, 'URI mailto has malformed header fields.',
    'error is set on malformed hfields')
  // Path recipient survives even when the headers list is malformed.
  t.deepEqual(c.to, ['joe@example.com'], 'path recipient is still set')
  t.end()
})

test('Mailto parse: IDN domain', (t) => {
  const c = fastURI.parse(
    'mailto:user@%E7%B4%8D%E8%B1%86.example.org?subject=Test&body=NATTO'
  )
  // IDN conversion uses the same new URL trick the generic host parser uses;
  // it can vary by platform, so just check the recipient is preserved and the
  // subject/body are decoded.
  t.ok(Array.isArray(c.to) && c.to.length === 1, 'one recipient')
  t.equal(c.subject, 'Test', 'subject')
  t.equal(c.body, 'NATTO', 'body')
  t.end()
})

test('Mailto serialize: bare and trivial', (t) => {
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['chris@example.com'] }),
    'mailto:chris@example.com',
    'bare address'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], body: 'current-issue' }),
    'mailto:user@example.org?body=current-issue',
    'body without special chars'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], body: 'send current-issue' }),
    'mailto:user@example.org?body=send%20current-issue',
    'body with space'
  )
  t.equal(
    fastURI.serialize({
      scheme: 'mailto',
      to: ['user@example.org'],
      body: 'send current-issue\r\nsend index'
    }),
    'mailto:user@example.org?body=send%20current-issue%0D%0Asend%20index',
    'body with CRLF'
  )
  t.end()
})

test('Mailto serialize: header encoding', (t) => {
  t.equal(
    fastURI.serialize({
      scheme: 'mailto',
      to: ['user@example.org'],
      subject: '=?utf-8?Q?caf=C3=A9?='
    }),
    'mailto:user@example.org?subject=%3D%3Futf-8%3FQ%3Fcaf%3DC3%3DA9%3F%3D',
    'subject with = and ? is percent-encoded'
  )
  t.equal(
    fastURI.serialize({
      scheme: 'mailto',
      to: ['user@example.org'],
      subject: 'café'
    }),
    'mailto:user@example.org?subject=caf%C3%A9',
    'subject UTF-8'
  )
  t.equal(
    fastURI.serialize({
      scheme: 'mailto',
      to: ['joe@example.com'],
      headers: { cc: 'bob@example.com', body: 'hello' }
    }),
    'mailto:joe@example.com?cc=bob@example.com&body=hello',
    'headers + body merged; insertion order preserved'
  )
  t.end()
})

test('Mailto serialize: header delimiters round-trip without splitting fields', (t) => {
  const valueComponent = {
    scheme: 'mailto',
    to: ['user@example.org'],
    headers: { x: 'a&b' }
  }
  const valueURI = fastURI.serialize(valueComponent)
  t.equal(valueURI, 'mailto:user@example.org?x=a%26b', 'ampersand in value is encoded')
  t.deepEqual(fastURI.parse(valueURI).headers, { x: 'a&b' }, 'value round-trips')

  const nameComponent = {
    scheme: 'mailto',
    to: ['user@example.org'],
    headers: { 'x&y': 'z' }
  }
  const nameURI = fastURI.serialize(nameComponent)
  t.equal(nameURI, 'mailto:user@example.org?x%26y=z', 'ampersand in name is encoded')
  t.deepEqual(fastURI.parse(nameURI).headers, { 'x&y': 'z' }, 'name round-trips')
  t.end()
})

test('Mailto serialize: Unicode uses valid UTF-8 percent encoding', (t) => {
  const component = {
    scheme: 'mailto',
    to: ['😀@example.org'],
    subject: '😀',
    body: 'go 🚀',
    headers: { x: '😀' }
  }
  const uri = fastURI.serialize(component)
  t.equal(
    uri,
    'mailto:%F0%9F%98%80@example.org?x=%F0%9F%98%80&subject=%F0%9F%98%80&body=go%20%F0%9F%9A%80',
    'supplementary characters use four-byte UTF-8'
  )
  t.doesNotThrow(() => decodeURIComponent(uri), 'serialized URI can be decoded')
  const parsed = fastURI.parse(uri)
  t.deepEqual(parsed.to, ['😀@example.org'], 'local part round-trips')
  t.equal(parsed.subject, '😀', 'subject round-trips')
  t.equal(parsed.body, 'go 🚀', 'body round-trips')
  t.deepEqual(parsed.headers, { x: '😀' }, 'custom header round-trips')
  t.end()
})

test('Mailto serialize: lone surrogates become U+FFFD', (t) => {
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], subject: '\uD800' }),
    'mailto:user@example.org?subject=%EF%BF%BD',
    'lone high surrogate'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], body: '\uDC00' }),
    'mailto:user@example.org?body=%EF%BF%BD',
    'lone low surrogate'
  )
  t.end()
})

test('Mailto serialize: percent escapes are preserved or escaped', (t) => {
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], subject: 'a%2fb' }),
    'mailto:user@example.org?subject=a%2Fb',
    'valid escape is preserved and uppercased'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['user@example.org'], subject: 'a%GGb' }),
    'mailto:user@example.org?subject=a%25GGb',
    'malformed escape has its percent sign encoded'
  )
  t.end()
})

test('Mailto serialize: input components are not mutated', (t) => {
  const component = {
    scheme: 'mailto',
    to: ['café@EXAMPLE.ORG'],
    subject: 'hello',
    headers: { cc: 'other@example.org' }
  }
  const expected = JSON.parse(JSON.stringify(component))
  fastURI.serialize(component)
  t.deepEqual(component, expected, 'recipient and header containers remain unchanged')
  t.end()
})

test('Mailto serialize: local-part encoding', (t) => {
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['gorby%25kremvax@example.com'] }),
    'mailto:gorby%25kremvax@example.com',
    'literal %25 preserved uppercased'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['unlikely%3Faddress@example.com'] }),
    'mailto:unlikely%3Faddress@example.com',
    'literal %3F preserved'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['"not@me"@example.org'] }),
    'mailto:%22not%40me%22@example.org',
    '" and @ in local part are encoded'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['Mike&family@example.org'] }),
    'mailto:Mike%26family@example.org',
    '& in local part is encoded'
  )
  t.end()
})

test('Mailto equals: cross-form normalization', (t) => {
  t.equal(
    fastURI.equal(
      'mailto:addr1@an.example,addr2@an.example',
      'mailto:?to=addr1@an.example,addr2@an.example'
    ),
    true,
    'path recipients == ?to= recipients'
  )
  t.equal(
    fastURI.equal(
      'mailto:?to=addr1@an.example,addr2@an.example',
      'mailto:addr1@an.example?to=addr2@an.example'
    ),
    true,
    '?to= only == mixed path + ?to='
  )
  t.end()
})

test('Mailto domain normalization honors unicodeSupport', (t) => {
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

test('Mailto parse: malformed domains are preserved and reported', (t) => {
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

test('Mailto parse: bracketed domain literals are preserved', (t) => {
  const parsed = fastURI.parse('mailto:user@[IPv6:2001:db8::1]')
  t.equal(parsed.error, undefined, 'valid domain literal has no error')
  t.deepEqual(parsed.to, ['user@[ipv6:2001:db8::1]'], 'domain literal is normalized without URL parsing')
  t.end()
})

test('Mailto parse: empty query does not create an empty header', (t) => {
  const parsed = fastURI.parse('mailto:user@example.org?')
  t.equal(parsed.query, undefined, 'query is cleared')
  t.equal(parsed.headers, undefined, 'headers remain undefined')
  t.end()
})

test('Mailto equals: domain-only case normalization', (t) => {
  t.equal(
    fastURI.equal('mailto:user@EXAMPLE.ORG', 'mailto:user@example.org'),
    true,
    'domain comparison remains case-insensitive'
  )
  t.equal(
    fastURI.equal('mailto:User@example.org', 'mailto:user@example.org'),
    false,
    'local part remains case-sensitive'
  )
  t.equal(
    fastURI.equal('mailto:user@example.org?subject=Hello', 'mailto:user@example.org?subject=hello'),
    false,
    'subject remains case-sensitive'
  )
  t.equal(
    fastURI.equal('mailto:user@example.org?body=Hello', 'mailto:user@example.org?body=hello'),
    false,
    'body remains case-sensitive'
  )
  t.equal(
    fastURI.equal('mailto:user@example.org?x=Hello', 'mailto:user@example.org?x=hello'),
    false,
    'custom header value remains case-sensitive'
  )
  t.end()
})

test('Mailto equality change does not affect other schemes', (t) => {
  t.equal(fastURI.equal('http://EXAMPLE.ORG/Path', 'http://example.org/path'), true, 'HTTP behavior unchanged')
  t.equal(fastURI.equal('https://EXAMPLE.ORG/Path', 'https://example.org/path'), true, 'HTTPS behavior unchanged')
  t.equal(fastURI.equal('WS://EXAMPLE.ORG/Chat', 'ws://example.org/chat'), true, 'WS behavior unchanged')
  t.equal(fastURI.equal('WSS://EXAMPLE.ORG/Chat', 'wss://example.org/chat'), true, 'WSS behavior unchanged')
  t.equal(fastURI.equal('URN:FOO:A123', 'urn:foo:a123'), true, 'URN behavior unchanged')
  t.end()
})

test('Mailto round-trip', (t) => {
  const cases = [
    'mailto:chris@example.com',
    'mailto:infobot@example.com?subject=hello%20world&body=line%0D%0Atwo',
    'mailto:list@example.org?cc=bob@example.com&body=subscribe',
    'mailto:joe@example.com,alice@example.org?subject=Test',
    'mailto:%22oh%5C%5Cno%22@example.org'
  ]
  for (const uri of cases) {
    const serialized = fastURI.serialize(fastURI.parse(uri))
    t.equal(serialized, uri, 'round-trip ' + uri)
  }
  t.end()
})

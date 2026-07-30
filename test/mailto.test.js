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

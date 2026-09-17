'use strict'

const test = require('tape')
const fastURI = require('..')

const HOST_ERROR = 'URI host is malformed.'

const malformedLiterals = [
  '::not-valid',
  'fc00::not-hex',
  'fe80::not-hex',
  '1:2:3',
  '1:2:3:4:5:6:7',
  '1:2:3:4:5:6:7:8:9',
  '1::2::3',
  '1:::2',
  ':::1',
  '12345::',
  '1:2:3:4:5:6:7::8',
  '::ffff:192.0.2.999',
  '::ffff:192.0.2',
  '::ffff:192.168.001.1',
  '::192.0.2.1:1',
  '1:2:3:4:5:192.0.2.1::',
  'v.foo',
  'v1.',
  'v1.foo%25bar',
  'v1.K',
  'fe80::1%25',
  'fe80::1%25eth 0',
  'fe80::1%25eth%ZZ',
  'fe80::1%25K',
  'not-an-ip'
]

test('malformed bracketed IP literals fail without being rewritten', (t) => {
  for (const literal of malformedLiterals) {
    const uri = `http://[${literal}]/private`
    const parsed = fastURI.parse(uri)

    t.equal(parsed.error, HOST_ERROR, `parse rejects ${literal}`)
    t.equal(parsed.host, `[${literal.toLowerCase()}]`, `parse does not truncate ${literal}`)
    t.equal(fastURI.normalize(uri), uri, `normalize preserves ${literal}`)
    t.equal(fastURI.equal(uri, uri), false, `equal rejects ${literal}`)
  }
  t.end()
})

test('resolve throws for malformed bracketed IP literals', (t) => {
  for (const literal of malformedLiterals) {
    const uri = `http://[${literal}]/private`

    t.throws(
      () => fastURI.resolve(uri, 'child'),
      /URI host is malformed\./,
      `rejects malformed base ${literal}`
    )
    t.throws(
      () => fastURI.resolve('http://example.com/', uri),
      /URI host is malformed\./,
      `rejects malformed relative input ${literal}`
    )
  }
  t.end()
})

test('valid IPv6, IPvFuture, embedded IPv4, and zone forms normalize safely', (t) => {
  const cases = [
    ['http://[::]/', 'http://[::]/', '::'],
    ['http://[::1]/', 'http://[::1]/', '::1'],
    ['http://[1::]/', 'http://[1::]/', '1::'],
    ['http://[2001:0DB8::0001]/', 'http://[2001:db8::1]/', '2001:db8::1'],
    ['http://[0:0:0:0:0:0:0:0]/', 'http://[::]/', '::'],
    ['http://[::ffff:192.0.2.1]/', 'http://[::ffff:192.0.2.1]/', '::ffff:192.0.2.1'],
    ['http://[1:2:3:4:5:6:192.0.2.1]/', 'http://[1:2:3:4:5:6:192.0.2.1]/', '1:2:3:4:5:6:192.0.2.1'],
    ['http://[fe80::A%25EN1]/', 'http://[fe80::a%25EN1]/', 'fe80::a%EN1'],
    ['http://[fe80::a%en1]/', 'http://[fe80::a%25en1]/', 'fe80::a%en1'],
    ['http://[fe80::a%25eth%2D0]/', 'http://[fe80::a%25eth%2D0]/', 'fe80::a%eth%2D0'],
    ['http://[v1.example]/', 'http://[v1.example]/', '[v1.example]'],
    ['http://[vF.A:b]/', 'http://[vf.a:b]/', '[vf.a:b]']
  ]

  for (const [uri, normalized, host] of cases) {
    const parsed = fastURI.parse(uri)
    t.equal(parsed.error, undefined, `${uri} parses without error`)
    t.equal(parsed.host, host, `${uri} has the expected host`)
    t.equal(fastURI.normalize(uri), normalized, `${uri} normalizes safely`)
  }
  t.end()
})

test('IPv6 zone identifiers are validated correctly', (t) => {
  const valid = [
    'http://[fe80::1%25eth0]/',
    'http://[fe80::a%en1]/',
    'http://[fe80::a%25eth%2D0]/'
  ]

  for (const uri of valid) {
    const parsed = fastURI.parse(uri)

    t.equal(parsed.error, undefined, `${uri} parses without error`)
  }

  const malformed = [
    'http://[fe80::1%25]/',
    'http://[fe80::1%25eth 0]/',
    'http://[fe80::1%25eth%ZZ]/',
    'http://[fe80::1%25K]/'
  ]

  for (const uri of malformed) {
    const parsed = fastURI.parse(uri)

    t.equal(parsed.error, HOST_ERROR, `${uri} is rejected`)
    t.equal(fastURI.normalize(uri), uri, `${uri} is not rewritten`)
    t.equal(fastURI.equal(uri, uri), false, `${uri} is not comparable`)
  }
  t.end()
})

test('zoned IPv6 hosts beginning with "25" round-trip through parse/normalize/serialize/equal', (t) => {
  const cases = [
    // zones beginning with "25" (once ambiguous with a %25 separator)
    ['http://[fe80::1%2525]/', 'fe80::1%25', 'http://[fe80::1%2525]/'],
    ['http://[fe80::1%2525eth0]/', 'fe80::1%25eth0', 'http://[fe80::1%2525eth0]/'],
    ['http://[fe80::1%2525en1]/', 'fe80::1%25en1', 'http://[fe80::1%2525en1]/'],
    // zones that do not begin with "25" must stay idempotent
    ['http://[fe80::1%25eth0]/', 'fe80::1%eth0', 'http://[fe80::1%25eth0]/'],
    ['http://[fe80::a%en1]/', 'fe80::a%en1', 'http://[fe80::a%25en1]/'],
    ['http://[fe80::a%25eth%2D0]/', 'fe80::a%eth%2D0', 'http://[fe80::a%25eth%2D0]/']
  ]

  for (const [input, host, normalized] of cases) {
    const parsed = fastURI.parse(input)
    t.equal(parsed.error, undefined, `${input} parses without error`)
    t.equal(parsed.host, host, `${input} exposes the expected host`)
    t.equal(fastURI.normalize(input), normalized, `${input} normalizes to the canonical form`)
    t.equal(fastURI.serialize(parsed), normalized, `${input} serializes to the canonical form`)
    const reparsed = fastURI.parse(normalized)
    t.equal(reparsed.error, undefined, `${input} canonical output reparses without error`)
    t.equal(reparsed.host, host, `${input} parse-after-normalize is stable`)
  }

  // distinct zones must not be conflated by equal
  t.equal(
    fastURI.equal('http://[fe80::1%2525eth0]/', 'http://[fe80::1%25eth0]/'),
    false,
    'equal distinguishes zones "25eth0" and "eth0"'
  )
  t.equal(
    fastURI.equal('http://[fe80::1%2525]/', 'http://[fe80::1%25eth0]/'),
    false,
    'equal distinguishes zones "25" and "eth0"'
  )
  // the same zone still compares equal
  t.equal(
    fastURI.equal('http://[fe80::1%2525eth0]/', 'http://[fe80::1%2525eth0]/'),
    true,
    'an identical zoned authority is equal'
  )
  t.equal(
    fastURI.equal('http://[fe80::1%2525]/', 'http://[fe80::1%2525]/'),
    true,
    'zone "25" equals itself'
  )

  // resolve must preserve the zone too
  t.equal(
    fastURI.resolve('http://example.com/', 'http://[fe80::1%2525eth0]/path'),
    'http://[fe80::1%2525eth0]/path',
    'resolve preserves a zone beginning with "25"'
  )
  t.equal(
    fastURI.resolve('http://[fe80::1%2525eth0]/', 'child'),
    'http://[fe80::1%2525eth0]/child',
    'resolve preserves a zoned base'
  )

  t.end()
})

test('serialize only trusts the parse-derived IPv6 zone while the host is unchanged', (t) => {
  // Reassigning `host` after parse must take effect for serialize.
  const parsed = fastURI.parse('http://[::1]/admin')
  parsed.host = 'example.com'
  t.equal(
    fastURI.serialize(parsed),
    'http://example.com/admin',
    'a host reassigned after parse wins over the stale zone'
  )

  // A caller-supplied `ipv6Zone` that does not match `host` must be ignored.
  const forged = fastURI.serialize({
    scheme: 'http',
    host: 'fe80::1%25en1',
    ipv6Zone: 'eth0',
    path: '/'
  })
  t.equal(forged, 'http://[fe80::1%25en1]/', 'a mismatched ipv6Zone is ignored')
  t.equal(fastURI.parse(forged).host, 'fe80::1%en1', 'mismatched ipv6Zone cannot redirect the parsed host')

  // A caller-supplied `ipv6Zone` on a non-zoned host must be ignored too.
  const noZone = fastURI.serialize({
    scheme: 'http',
    host: 'good.example',
    ipv6Zone: 'eth0',
    path: '/'
  })
  t.equal(noZone, 'http://good.example/', 'ipv6Zone on a non-zoned host is ignored')

  // Reassigning a zoned host to a different zone must recompute, not reuse.
  const zoned = fastURI.parse('http://[fe80::1%2525eth0]/')
  zoned.host = 'fe80::1%25en1'
  t.equal(
    fastURI.serialize(zoned),
    'http://[fe80::1%25en1]/',
    'rewriting the zone recomposes from the new host'
  )

  // A consistent caller-supplied zone is honored (explicit disambiguation).
  const disambiguated = fastURI.serialize({
    scheme: 'http',
    host: 'fe80::1%25eth0',
    ipv6Zone: '25eth0',
    path: '/'
  })
  t.equal(
    disambiguated,
    'http://[fe80::1%2525eth0]/',
    'a consistent ipv6Zone disambiguates the component host'
  )

  // Without ipv6Zone, an ambiguous single-"%" host falls back to the
  // best-effort heuristic (documented behavior for hand-built components).
  t.equal(
    fastURI.serialize({ host: 'fe80::1%25eth0' }),
    '//[fe80::1%25eth0]',
    'an ambiguous host without ipv6Zone uses the best-effort heuristic'
  )

  // Mutating the host must not poison resolve either.
  t.equal(
    fastURI.resolve('http://example.com/', 'http://[fe80::1%2525eth0]/path'),
    'http://[fe80::1%2525eth0]/path',
    'resolve preserves the parse-derived zone'
  )

  t.end()
})

test('hosts with unbalanced or misplaced IP-literal brackets are rejected', (t) => {
  const malformed = [
    'http://[fe80',
    'http://[',
    'http://[not-an-ip',
    'http://[\u65e5\u672c',
    'http://user@[@127.0.0.1:8123/admin',
    'http://user@]127.0.0.1:8123/admin',
    'http://user@prefix[@127.0.0.1:8123/admin',
    'http://user@prefix]@127.0.0.1:8123/admin'
  ]
  const modes = [
    ['default', undefined],
    ['Unicode', { unicodeSupport: true }]
  ]

  for (const [mode, options] of modes) {
    for (const uri of malformed) {
      const parsed = fastURI.parse(uri, options)
      const message = `${mode} mode rejects ${uri}`

      t.equal(parsed.error, HOST_ERROR, `parse ${message}`)
      t.equal(fastURI.normalize(uri, options), uri, `normalize preserves ${uri} in ${mode} mode`)
      t.equal(fastURI.equal(uri, uri, options), false, `equal ${message}`)
      t.throws(
        () => fastURI.resolve('http://example.com/', uri, options),
        /URI host is malformed\./,
        `resolve ${message}`
      )
    }
  }
  t.end()
})

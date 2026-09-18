'use strict'

const test = require('tape')
const fastURI = require('..')

// GHSA-88VG-QFHM-JX5Q: `mailto://h/a` carries an authority (which RFC 6068 does
// not define for `mailto`) and a path. `mailtoParse` used to retain that
// authority and fold the path's leading "/" into the recipient local part; the
// generic serializer then reinserted a "/" separator on every pass, so
// serialize(parse(x)) was not a fixpoint and normalize() accreted one "%2F" per
// pass (unbounded growth for a renormalize-to-fixpoint consumer).

const authorityForms = [
  ['mailto://h/a', 'mailto:%2Fa@'],
  ['mailto://h/a@b', 'mailto:%2Fa@b'],
  ['mailto://h/', 'mailto:%2F@'],
  ['mailto://h/a,b', 'mailto:%2Fa@,b@'],
  ['mailto://user@h/a', 'mailto:%2Fa@'],
  ['mailto://h:8080/a', 'mailto:%2Fa@'],
  ['mailto://', 'mailto://'],
  // recipients can come from a `to=` hfield even when the path is empty
  ['mailto://h?to=x@y', 'mailto:x@y'],
  ['mailto://h?to=x@y&to=a@b', 'mailto:x@y,a@b']
]

test('mailto with a retained authority and a path normalizes to a fixpoint', (t) => {
  t.plan(authorityForms.length * 2)

  for (const [input] of authorityForms) {
    const once = fastURI.normalize(input)
    const twice = fastURI.normalize(once)

    t.equal(twice, once, input + ' normalize is idempotent')
    t.equal(fastURI.equal(input, once), true, input + ' equals its normalized form')
  }
})

test('mailto serialize(parse()) is a stable round trip for the authority form', (t) => {
  t.plan(authorityForms.length)

  for (const [input, expected] of authorityForms) {
    t.equal(fastURI.serialize(fastURI.parse(input)), expected, input + ' round trips to a stable value')
  }
})

test('mailto authority form does not grow without bound under renormalization', (t) => {
  // A renormalize-to-fixpoint loop must terminate instead of growing forever.
  // A single normalize call already terminates, so this guards the fixpoint.
  const inputs = ['mailto://h/a', 'mailto://h/a@b', 'mailto://h/a,b']

  t.plan(inputs.length * 2)

  for (const input of inputs) {
    const first = fastURI.normalize(input)
    let s = input
    let iters = 0
    let stable = false
    while (iters < 1000) {
      const next = fastURI.normalize(s)
      if (next === s) {
        stable = true
        break
      }
      s = next
      iters++
    }

    t.equal(stable, true, input + ' reaches a fixpoint')
    t.equal(s.length, first.length, input + ' does not grow')
  }
})

test('mailto authority handling preserves host normalization for skip-normalize schemes', (t) => {
  // Regression: a bare `mailto://host` with no path must keep its host and stay
  // idempotent, so the generic host normalization path is unaffected.
  const encodedHost = 'mailto://%41.com'
  const literalHost = 'mailto://a.com'

  t.equal(fastURI.parse(encodedHost).host, fastURI.parse(literalHost).host, 'parse results have consistent hosts')
  t.equal(fastURI.normalize(encodedHost), fastURI.normalize(literalHost), 'normalize results are consistent')
  t.equal(fastURI.equal(encodedHost, literalHost), true, 'encoded and literal hosts compare equal')
  t.equal(fastURI.normalize(literalHost), literalHost, 'bare authority mailto is idempotent')
  t.end()
})

test('mailto authority form is reported as malformed on the parsed component', (t) => {
  t.equal(
    fastURI.parse('mailto://h/a').error,
    'URI mailto must not have an authority component.',
    'the retained authority is surfaced as an error'
  )

  // A valid, authority-free mailto must not be flagged.
  t.equal(fastURI.parse('mailto:user@host.com').error, undefined, 'well-formed mailto has no error')
  t.end()
})

test('mailto serializer drops caller-supplied authority when recipients are present', (t) => {
  t.equal(
    fastURI.serialize({ scheme: 'mailto', host: 'h', to: ['a@b'] }),
    'mailto:a@b',
    'authority is dropped for direct recipients'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', userinfo: 'u', host: 'h', port: 8080, to: ['a@b'] }),
    'mailto:a@b',
    'userinfo, host, and port are dropped for direct recipients'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', host: 'h', headers: { to: 'a@b' } }),
    'mailto:a@b',
    'authority is dropped for recipients supplied through a to hfield'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', host: 'h', to: ['a@b'], subject: 'hello' }),
    'mailto:a@b?subject=hello',
    'dropping authority preserves header fields'
  )
  t.equal(
    fastURI.serialize({ scheme: 'mailto', host: 'h' }),
    'mailto://h',
    'bare authority without recipients remains idempotent'
  )
  t.end()
})

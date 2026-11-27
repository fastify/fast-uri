'use strict'

const test = require('tape')
const fastURI = require('..')

const MODES = [
  ['ASCII', {}],
  ['Unicode', { unicodeSupport: true }]
]
const SCHEMES = ['http', 'https', 'ws', 'wss']
const LEGACY_IPV4_HOSTS = ['2130706433', '0x7f.1', '0177.0.0.1', '127.1', '0x7f000001']

/**
 * The hostname the platform parser reports, or `undefined` when it rejects the
 * host. Browsers do not agree on every IPv4 edge form, so an expectation must
 * come from the running engine.
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

test('legacy IPv4 hosts canonicalize to dotted decimal regardless of unicodeSupport', (t) => {
  for (const [mode, options] of MODES) {
    for (const scheme of SCHEMES) {
      for (const host of LEGACY_IPV4_HOSTS) {
        const input = `${scheme}://${host}/`
        const label = `${mode} ${input}`

        t.equal(fastURI.parse(input, options).host, '127.0.0.1', `${label} parse`)
        t.equal(
          fastURI.normalize(input, options),
          fastURI.normalize(`${scheme}://127.0.0.1/`, options),
          `${label} normalize`
        )
        t.equal(fastURI.equal(input, `${scheme}://127.0.0.1/`, options), true, `${label} equal`)
        t.equal(
          fastURI.resolve(`${scheme}://base.example/`, `//${host}/`, options),
          `${scheme}://127.0.0.1/`,
          `${label} resolve`
        )
      }
    }
  }
  t.end()
})

test('legacy IPv4 hosts canonicalize with the domainHost option', (t) => {
  for (const [mode, options] of MODES) {
    const opts = Object.assign({ domainHost: true }, options)
    t.equal(fastURI.parse('custom://0x7f.1/', opts).host, '127.0.0.1', `${mode} parse`)
    t.equal(fastURI.equal('custom://2130706433/', 'custom://127.0.0.1/', opts), true, `${mode} equal`)
  }
  t.end()
})

test('the IPv4 final-label rule applies in both modes', (t) => {
  // `0x`, `1.` and `1..` are the boundary forms of the final-label rule. The
  // engine decides whether `0x` converts, so compare against `new URL`.
  for (const [mode, options] of MODES) {
    for (const host of ['0x', '1.', '1..']) {
      const expected = whatwgHost(host)
      const parsed = fastURI.parse(`http://${host}/`, options)
      const label = `${mode} http://${host}/`

      if (expected === undefined) {
        t.equal(parsed.host, host, `${label} keeps the label`)
        t.notEqual(parsed.error, undefined, `${label} reports the failed conversion`)
        continue
      }
      t.equal(parsed.host, expected, `${label} matches new URL`)
      t.equal(parsed.error, undefined, `${label} converts without an error`)
    }
    t.ok(fastURI.parse('http://a.0x/', options).error, `${mode} a.0x reports an error`)
  }
  t.end()
})

test('mailto recipient domains keep their own mode', (t) => {
  const converted = whatwgHost('0x7f')
  if (converted !== undefined) {
    t.deepEqual(fastURI.parse('mailto:user@0x7f').to, ['user@' + converted], 'ASCII mode converts')
  }
  t.deepEqual(fastURI.parse('mailto:user@0x7f', { unicodeSupport: true }).to, ['user@0x7f'], 'Unicode mode keeps the input')
  t.end()
})

test('hosts rejected by the WHATWG host parser fail closed regardless of unicodeSupport', (t) => {
  const inputs = [
    'http://1.2.3.4.5/',
    'http://a.b.1/',
    'http://bü%2Fcher.de/',
    'http://a..b%zz/',
    'http://a@b@evil.com/',
    'http://ev\til.com/p'
  ]

  for (const [mode, options] of MODES) {
    for (const input of inputs) {
      const label = `${mode} ${JSON.stringify(input)}`
      t.ok(fastURI.parse(input, options).error, `${label} parse sets error`)
      t.equal(fastURI.normalize(input, options), input, `${label} normalize returns input`)
      t.equal(fastURI.equal(input, input, options), false, `${label} equal is false`)
      t.throws(() => fastURI.resolve('http://base.example/', input, options), `${label} resolve throws`)
    }
  }
  t.end()
})

test('unicodeSupport keeps Unicode domain hosts', (t) => {
  const options = { unicodeSupport: true }

  t.equal(fastURI.parse('http://bücher.de/', options).host, 'bücher.de', 'parse')
  t.equal(fastURI.parse('http://BÜCHER.de/', options).host, 'bücher.de', 'parse lowercases')
  t.equal(fastURI.normalize('http://bücher.de/', options), 'http://bücher.de/', 'normalize')
  t.equal(fastURI.resolve('http://base.example/', '//bücher.de/', options), 'http://bücher.de/', 'resolve')
  t.equal(fastURI.parse('http://bücher.de/').host, 'xn--bcher-kva.de', 'ASCII mode uses punycode')
  t.end()
})

test('both modes lowercase a simple ASCII host', (t) => {
  for (const [mode, options] of MODES) {
    t.equal(fastURI.parse('http://mail2.example.org/', options).host, 'mail2.example.org', `${mode} digit host`)
    t.equal(fastURI.parse('http://EXAMPLE.COM/', options).host, 'example.com', `${mode} uppercase host`)
  }
  t.end()
})

test('equal compares domain hosts by their ASCII form in both modes', (t) => {
  const pairs = [
    ['http://bücher.de/', 'http://xn--bcher-kva.de/'],
    ['http://ｅｘａｍｐｌｅ．com/', 'http://example.com/'],
    ['http://example\u3002com/', 'http://example.com/'],
    ['ws://EXAMPLE.com/', 'ws://example.com/']
  ]

  for (const [mode, options] of MODES) {
    for (const [a, b] of pairs) {
      t.equal(fastURI.equal(a, b, options), true, `${mode} ${a} equals ${b}`)
    }
    t.equal(fastURI.equal('http://bücher.de/', 'http://bucher.de/', options), false, `${mode} distinct hosts differ`)
  }
  t.end()
})

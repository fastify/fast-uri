import { Bench } from 'tinybench'
import { fastUri } from '../index.js'

// Hot-path coverage for the encoding and host changes. Run the same file on
// the base commit to compare, for example with `git switch main`.

const { parse, normalize, serialize, resolve, equal } = fastUri

const cleanDomain = 'https://example.com/foo#bar$fiz'
const digitHost = 'https://mail2.example.org/foo#bar$fiz'
const longPath = 'https://example.com/' + 'a/b/c/d/e/f/g/h/'.repeat(20)
const escapeHeavy = 'https://example.com/%E6%97%A5/%7euser%41?q=%E6%97%A5&b=%2F#%E6%9C%AC'
const shortEscape = 'https://example.com/a%41b'
const nonAscii = 'https://example.com/日本語/プロフィール?q=値#断片'
// Hosts that must use the WHATWG parser.
const fallbackHost = 'https://0x7f.1/'
const idnHost = 'https://例え.example/'

const uriComponent = {
  scheme: 'uri',
  userinfo: 'foo:bar',
  host: 'example.com',
  port: 1,
  path: 'path',
  query: 'query',
  fragment: 'fragment'
}
const dottedComponent = { ...uriComponent, path: './a/./b/c/../.././d/../e/f/.././/' }
const flatComponent = { ...uriComponent, path: '../../a/b' }
const wsComponent = { scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true }
const mailtoComponent = {
  scheme: 'mailto',
  to: ['chris@example.com'],
  subject: 'current-issue',
  body: 'send current-issue\r\nsend index',
  headers: { 'In-Reply-To': '<3469A91.D10AF4C@example.com>' }
}

const bench = new Bench({ name: 'hot paths', time: 1000 })

bench.add('parse clean domain', () => parse(cleanDomain))
bench.add('parse digit host', () => parse(digitHost))
bench.add('parse long path', () => parse(longPath))
bench.add('parse escape heavy', () => parse(escapeHeavy))
bench.add('parse short escape', () => parse(shortEscape))
bench.add('parse non-ASCII path', () => parse(nonAscii))
bench.add('parse WHATWG fallback host', () => parse(fallbackHost))
bench.add('parse IDN host', () => parse(idnHost))
bench.add('normalize clean domain', () => normalize(cleanDomain))
bench.add('normalize escape heavy', () => normalize(escapeHeavy))
bench.add('normalize non-ASCII', () => normalize(nonAscii))
bench.add('serialize uri', () => serialize({ ...uriComponent }))
bench.add('serialize long path with dots', () => serialize({ ...dottedComponent }))
bench.add('serialize relative path with dots', () => serialize({ ...flatComponent }))
bench.add('serialize ws', () => serialize({ ...wsComponent }))
bench.add('serialize mailto', () => serialize(mailtoComponent))
bench.add('resolve', () => resolve('uri://a/b/c/d;p?q', '../../../g'))
bench.add('equal different', () => equal('example://a/b/c/%7Bfoo%7D', 'eXAMPLE://a/./b/../b/%63/%7bfoo%7d'))
bench.add('equal identical', () => equal(cleanDomain, cleanDomain))

await bench.run()
console.log(bench.name)
console.table(bench.table())

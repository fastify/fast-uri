import { Bench } from 'tinybench'
import { fastUri } from '../index.js'
import { parse as uriJsParse, serialize as uriJsSerialize, resolve as uriJsResolve, equal as uriJsEqual } from 'uri-js'

const base = 'uri://a/b/c/d;p?q'

const domain = 'https://example.com/foo#bar$fiz'
const ipv4 = '//10.10.10.10'
const ipv6 = '//[2001:db8::7]'
const urn = 'urn:foo:a123,456'
const urnuuid = 'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6'

const mailtoSimple = 'mailto:chris@example.com'
const mailtoWithSubject = 'mailto:infobot@example.com?subject=current-issue'
const mailtoWithBody = 'mailto:infobot@example.com?body=send%20current-issue%0D%0Asend%20index'
const mailtoWithHeaders = 'mailto:list@example.org?In-Reply-To=%3C3469A91.D10AF4C@example.com%3E'
const mailtoMultiple = 'mailto:joe@example.com,alice@example.org?subject=Test&body=NATTO'
const mailtoEncoded = 'mailto:%22oh%5C%5Cno%22@example.org'

const mailtoComponent = {
  scheme: 'mailto',
  to: ['chris@example.com'],
  subject: 'current-issue',
  body: 'send current-issue\r\nsend index',
  headers: { 'In-Reply-To': '<3469A91.D10AF4C@example.com>' }
}

const urnuuidComponent = {
  scheme: 'urn',
  nid: 'uuid',
  uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
}

const {
  parse: fastUriParse,
  serialize: fastUriSerialize,
  resolve: fastUriResolve,
  equal: fastUriEqual,
} = fastUri

// Initialization as there is a lot to parse at first
// eg: regexes
fastUriParse(domain)
uriJsParse(domain)

const benchFastUri = new Bench({ name: 'fast-uri benchmark' })
const benchUriJs = new Bench({ name: 'uri-js benchmark' })
const benchWHATWG = new Bench({ name: 'WHATWG URL benchmark' })

benchFastUri.add('fast-uri: parse domain', function () {
  fastUriParse(domain)
})
benchUriJs.add('urijs: parse domain', function () {
  uriJsParse(domain)
})
benchWHATWG.add('WHATWG URL: parse domain', function () {
  // eslint-disable-next-line
  new URL(domain)
})
benchFastUri.add('fast-uri: parse IPv4', function () {
  fastUriParse(ipv4)
})
benchUriJs.add('urijs: parse IPv4', function () {
  uriJsParse(ipv4)
})
benchFastUri.add('fast-uri: parse IPv6', function () {
  fastUriParse(ipv6)
})
benchUriJs.add('urijs: parse IPv6', function () {
  uriJsParse(ipv6)
})
benchFastUri.add('fast-uri: parse URN', function () {
  fastUriParse(urn)
})
benchUriJs.add('urijs: parse URN', function () {
  uriJsParse(urn)
})
benchWHATWG.add('WHATWG URL: parse URN', function () {
  // eslint-disable-next-line
  new URL(urn)
})
benchFastUri.add('fast-uri: parse URN uuid', function () {
  fastUriParse(urnuuid)
})
benchUriJs.add('urijs: parse URN uuid', function () {
  uriJsParse(urnuuid)
})
benchFastUri.add('fast-uri: serialize URN uuid', function () {
  fastUriSerialize(urnuuidComponent)
})
benchUriJs.add('uri-js: serialize URN uuid', function () {
  uriJsSerialize(urnuuidComponent)
})
benchFastUri.add('fast-uri: serialize uri', function () {
  fastUriSerialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  })
})
benchUriJs.add('urijs: serialize uri', function () {
  uriJsSerialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  })
})
benchFastUri.add('fast-uri: serialize long uri with dots', function () {
  fastUriSerialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: './a/./b/c/../.././d/../e/f/.././/',
    query: 'query',
    fragment: 'fragment'
  })
})
benchUriJs.add('urijs: serialize long uri with dots', function () {
  uriJsSerialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: './a/./b/c/../.././d/../e/f/.././/',
    query: 'query',
    fragment: 'fragment'
  })
})
benchFastUri.add('fast-uri: serialize IPv6', function () {
  fastUriSerialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
benchUriJs.add('urijs: serialize IPv6', function () {
  uriJsSerialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
benchFastUri.add('fast-uri: serialize ws', function () {
  fastUriSerialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})
benchUriJs.add('urijs: serialize ws', function () {
  uriJsSerialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})
benchFastUri.add('fast-uri: resolve', function () {
  fastUriResolve(base, '../../../g')
})
benchUriJs.add('urijs: resolve', function () {
  uriJsResolve(base, '../../../g')
})

benchFastUri.add('fast-uri: equal', function () {
  fastUriEqual('example://a/b/c/%7Bfoo%7D', 'eXAMPLE://a/./b/../b/%63/%7bfoo%7d')
})
benchUriJs.add('urijs: equal', function () {
  uriJsEqual('example://a/b/c/%7Bfoo%7D', 'eXAMPLE://a/./b/../b/%63/%7bfoo%7d')
})

benchFastUri.add('fast-uri: parse mailto simple', function () {
  fastUriParse(mailtoSimple)
})
benchUriJs.add('urijs: parse mailto simple', function () {
  uriJsParse(mailtoSimple)
})

benchFastUri.add('fast-uri: parse mailto subject', function () {
  fastUriParse(mailtoWithSubject)
})
benchUriJs.add('urijs: parse mailto subject', function () {
  uriJsParse(mailtoWithSubject)
})

benchFastUri.add('fast-uri: parse mailto body CRLF', function () {
  fastUriParse(mailtoWithBody)
})
benchUriJs.add('urijs: parse mailto body CRLF', function () {
  uriJsParse(mailtoWithBody)
})

benchFastUri.add('fast-uri: parse mailto headers', function () {
  fastUriParse(mailtoWithHeaders)
})
benchUriJs.add('urijs: parse mailto headers', function () {
  uriJsParse(mailtoWithHeaders)
})

benchFastUri.add('fast-uri: parse mailto multi recipient', function () {
  fastUriParse(mailtoMultiple)
})
benchUriJs.add('urijs: parse mailto multi recipient', function () {
  uriJsParse(mailtoMultiple)
})

benchFastUri.add('fast-uri: parse mailto encoded local', function () {
  fastUriParse(mailtoEncoded)
})
benchUriJs.add('urijs: parse mailto encoded local', function () {
  uriJsParse(mailtoEncoded)
})

benchFastUri.add('fast-uri: serialize mailto', function () {
  fastUriSerialize(mailtoComponent)
})
benchUriJs.add('urijs: serialize mailto', function () {
  uriJsSerialize(mailtoComponent)
})

benchFastUri.add('fast-uri: serialize+parse mailto round-trip', function () {
  fastUriSerialize(fastUriParse(mailtoWithBody))
})
benchUriJs.add('urijs: serialize+parse mailto round-trip', function () {
  uriJsSerialize(uriJsParse(mailtoWithBody))
})

await benchFastUri.run()
console.log(benchFastUri.name)
console.table(benchFastUri.table())

await benchUriJs.run()
console.log(benchUriJs.name)
console.table(benchUriJs.table())

await benchWHATWG.run()
console.log(benchWHATWG.name)
console.table(benchWHATWG.table())

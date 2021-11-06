const benchmark = require('benchmark')
const suite = new benchmark.Suite()
const fastURI = require('./')
const urijs = require('uri-js')

const base = 'uri://a/b/c/d;p?q'
// Initialization as there is a lot to parse at first
// eg: regexes
fastURI.parse('https://example.com')
urijs.parse('https://example.com')

suite.add('fastURI: parse domain', function () {
  fastURI.parse('https://example.com')
})
suite.add('urijs: parse domain', function () {
  urijs.parse('https://example.com')
})
suite.add('fastURI: parse IPv4', function () {
  fastURI.parse('//10.10.10.10')
})
suite.add('urijs: parse IPv4', function () {
  urijs.parse('//10.10.10.10')
})
suite.add('fastURI: parse IPv6', function () {
  fastURI.parse('//[2001:db8::7]')
})
suite.add('urijs: parse IPv6', function () {
  urijs.parse('//[2001:db8::7]')
})
suite.add('fastURI: serialize uri', function () {
  fastURI.serialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  })
})
suite.add('urijs: serialize uri', function () {
  urijs.serialize({
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  })
})
suite.add('fastURI: serialize IPv6', function () {
  fastURI.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
suite.add('urijs: serialize IPv6', function () {
  urijs.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
suite.add('fastURI: serialize ws', function () {
  fastURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})
suite.add('urijs: serialize ws', function () {
  urijs.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})
suite.add('fast-uri: resolve', function () {
  fastURI.resolve(base, '../../../g')
})
suite.add('urijs: resolve', function () {
  urijs.resolve(base, '../../../g')
})
suite.on('cycle', cycle)

suite.run()

function cycle (e) {
  console.log(e.target.toString())
}

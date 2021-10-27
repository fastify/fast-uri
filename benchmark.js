const benchmark = require('benchmark')
const suite = new benchmark.Suite()
const fastifyURI = require('./')
const urijs = require('uri-js')

// Initialization as there is a lot to parse at first
// eg: regexes
fastifyURI.parse('https://example.com')
urijs.parse('https://example.com')

suite.add('fastifyURI: parse domain', function () {
  fastifyURI.parse('https://example.com')
})
suite.add('urijs: parse domain', function () {
  urijs.parse('https://example.com')
})
suite.add('fastifyURI: parse IPv4', function () {
  fastifyURI.parse('//10.10.10.10')
})
suite.add('urijs: parse IPv4', function () {
  urijs.parse('//10.10.10.10')
})
suite.add('fastifyURI: parse IPv6', function () {
  fastifyURI.parse('//[2001:db8::7]')
})
suite.add('urijs: parse IPv6', function () {
  urijs.parse('//[2001:db8::7]')
})
suite.add('fastifyURI: serialize uri', function () {
  fastifyURI.serialize({
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
suite.add('fastifyURI: serialize IPv6', function () {
  fastifyURI.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
suite.add('urijs: serialize IPv6', function () {
  urijs.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' })
})
suite.add('fastifyURI: serialize ws', function () {
  fastifyURI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})
suite.add('urijs: serialize ws', function () {
  urijs.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true })
})

suite.on('cycle', cycle)

suite.run()

function cycle (e) {
  console.log(e.target.toString())
}

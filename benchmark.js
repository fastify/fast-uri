const benchmark = require('benchmark')
const suite = new benchmark.Suite()
const fastifyURI = require('./')
const urijs = require('uri-js')

// Initialization as there is a lot to parse at first
// eg: regexes
fastifyURI.parse('https://example.com')
urijs.parse('https://example.com')

suite.add('fastifyURI: parse', function () {
  fastifyURI.parse('https://example.com')
})
suite.add('urijs: parse', function () {
  urijs.parse('https://example.com')
})
suite.add('fastifyURI: IPv4', function () {
  fastifyURI.parse('//10.10.10.10')
})
suite.add('urijs: IPv4', function () {
  urijs.parse('//10.10.10.10')
})
suite.add('fastifyURI: IPv6', function () {
  fastifyURI.parse('//[2001:db8::7]')
})
suite.add('urijs: IPv6', function () {
  urijs.parse('//[2001:db8::7]')
})

suite.on('cycle', cycle)

suite.run()

function cycle (e) {
  console.log(e.target.toString())
}

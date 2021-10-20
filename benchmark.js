const benchmark = require('benchmark')
const suite = new benchmark.Suite()
const URI = require('./')
URI.parse('https://example.com')

suite.add('uri', function () {
  URI.parse('https://example.com')
})
suite.add('IPv4', function () {
  URI.parse('//10.10.10.10')
})
suite.add('IPv6', function () {
  URI.parse('//[2001:db8::7]')
})

suite.on('cycle', cycle)

suite.run()

function cycle (e) {
  console.log(e.target.toString())
}

'use strict'

const tap = require('tap')
const test = tap.test
const fastifyURI = require('../')
const urijs = require('uri-js')
test('compatibility Parse', (t) => {
  const toParse = [
    'https://fastify.org',
    '//10.10.10.10',
    '//10.10.000.10',
    '//[2001:db8::7%en0]',
    '//[2001:db8::1]:80',
    'uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body',
    'http://user:pass@example.com:123/one/space in.url?q1=a1&q2=a2#body',
    '//[::ffff:129.144.52.38]',
    'uri://10.10.10.10.example.com/en/process',
    '//[2606:2800:220:1:248:1893:25c8:1946]/test'
  ]
  toParse.forEach(x => {
    t.same(fastifyURI.parse(x), urijs.parse(x), x)
  })
  t.end()
})

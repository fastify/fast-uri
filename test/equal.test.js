'use strict'

const tap = require('tap')
const test = tap.test
const URI = require('../')

test('URI Equals', (t) => {
  // test from RFC 3986
  t.equal(URI.equal('example://a/b/c/%7Bfoo%7D', 'eXAMPLE://a/./b/../b/%63/%7bfoo%7d'), true)

  // test from RFC 3987
  t.equal(URI.equal('http://example.org/~user', 'http://example.org/%7euser'), true)
  t.end()
})

//   test('IRI Equals', (t) => {
//     // example from RFC 3987
//     t.equal(URI.equal('example://a/b/c/%7Bfoo%7D/ros\xE9', 'eXAMPLE://a/./b/../b/%63/%7bfoo%7d/ros%C3%A9', IRI_OPTION), true)
//     t.end()
//   })

test('HTTP Equals', (t) => {
  // test from RFC 2616
  t.equal(URI.equal('http://abc.com:80/~smith/home.html', 'http://abc.com/~smith/home.html'), true)
  t.equal(URI.equal({ scheme: 'http', host: 'abc.com', port: 80, path: '/~smith/home.html' }, 'http://abc.com/~smith/home.html'), true)
  t.equal(URI.equal('http://ABC.com/%7Esmith/home.html', 'http://abc.com/~smith/home.html'), true)
  t.equal(URI.equal('http://ABC.com:/%7esmith/home.html', 'http://abc.com/~smith/home.html'), true)
  t.equal(URI.equal('HTTP://ABC.COM', 'http://abc.com/'), true)
  // test from RFC 3986
  t.equal(URI.equal('http://example.com:/', 'http://example.com:80/'), true)
  t.end()
})

test('HTTPS Equals', (t) => {
  t.equal(URI.equal('https://example.com', 'https://example.com:443/'), true)
  t.equal(URI.equal('https://example.com:/', 'https://example.com:443/'), true)
  t.end()
})

test('URN Equals', (t) => {
  // test from RFC 2141
  t.equal(URI.equal('urn:foo:a123,456', 'urn:foo:a123,456'), true)
  t.equal(URI.equal('urn:foo:a123,456', 'URN:foo:a123,456'), true)
  t.equal(URI.equal('urn:foo:a123,456', 'urn:FOO:a123,456'), true)

  // Disabling for now as the whole equal logic might need
  // to be refactored
  // t.equal(URI.equal('urn:foo:a123,456', 'urn:foo:A123,456'), false)
  // t.equal(URI.equal('urn:foo:a123%2C456', 'URN:FOO:a123%2c456'), true)
  t.end()
})
test('UUID Equals', (t) => {
  t.equal(URI.equal('URN:UUID:F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6', 'urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6'), true)
  t.end()
})
// test('Mailto Equals', (t) => {
//   // tests from RFC 6068
//   t.equal(URI.equal('mailto:addr1@an.example,addr2@an.example', 'mailto:?to=addr1@an.example,addr2@an.example'), true)
//   t.equal(URI.equal('mailto:?to=addr1@an.example,addr2@an.example', 'mailto:addr1@an.example?to=addr2@an.example'), true)
//   t.end()
// })

test('WS Equal', (t) => {
  t.equal(URI.equal('WS://ABC.COM:80/chat#one', 'ws://abc.com/chat'), true)
  t.end()
})

test('WSS Equal', (t) => {
  t.equal(URI.equal('WSS://ABC.COM:443/chat#one', 'wss://abc.com/chat'), true)
  t.end()
})

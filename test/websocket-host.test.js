'use strict'

const test = require('tape')
const fastURI = require('..')

const WS_HOST_ERROR = 'WebSocket URIs must have a host.'

test('parse reports an error for WebSocket URIs without a host', (t) => {
  for (const scheme of ['ws', 'wss']) {
    const cases = [
      `${scheme}:`,
      `${scheme}://`,
      `${scheme}://:80/chat`,
      `${scheme}:///example.com/chat`,
      `${scheme}:////example.com/chat`,
      `${scheme}:/example.com/chat`,
      `${scheme}:example.com`,
      `${scheme.toUpperCase()}:///example.com/chat`
    ]

    for (const uri of cases) {
      const parsed = fastURI.parse(uri)
      t.notOk(parsed.host, `${uri} has no host`)
      t.equal(parsed.error, WS_HOST_ERROR, `${uri} reports the missing host`)
    }
  }

  t.end()
})

test('parse accepts WebSocket URIs with a host', (t) => {
  for (const scheme of ['ws', 'wss']) {
    for (const uri of [
      `${scheme}://example.com`,
      `${scheme}://example.com:8080/chat?a=b`,
      `${scheme}://127.0.0.1/chat`,
      `${scheme}://[::1]/chat`
    ]) {
      t.equal(fastURI.parse(uri).error, undefined, `${uri} parses without error`)
    }
  }

  t.end()
})

test('parse with the ws scheme option requires a host like the http option', (t) => {
  t.equal(fastURI.parse('/chat', { scheme: 'http' }).error, 'HTTP URIs must have a host.')
  t.equal(fastURI.parse('/chat', { scheme: 'ws' }).error, WS_HOST_ERROR)
  t.equal(fastURI.parse('//example.com/chat', { scheme: 'ws' }).error, undefined)
  t.end()
})

test('resolve rejects an empty host for WebSocket results', (t) => {
  const cases = [
    ['ws://base.example/', '///evil.example/chat'],
    ['wss://base.example/', '////evil.example/chat'],
    ['ws://base.example/', '//'],
    ['ws://base.example/', 'ws:///evil.example/chat'],
    ['ws://base.example/', 'wss:/evil.example/chat'],
    ['ws://base.example/', 'ws:evil.example'],
    ['http://base.example/', 'wss:///evil.example/chat'],
    ['wss:///evil.example', ''],
    ['ws://base.example/', '///evil.example', { scheme: 'null' }]
  ]

  t.plan(cases.length + 3)
  for (const [base, relative, options] of cases) {
    t.throws(
      () => fastURI.resolve(base, relative, options),
      /WebSocket URIs must have a host/,
      `${base} + ${relative}`
    )
  }

  t.equal(
    fastURI.resolve('ws://base.example/', '//other.example/chat'),
    'ws://other.example/chat',
    'a non-empty WebSocket authority remains valid'
  )
  t.equal(
    fastURI.resolve('wss://base.example/a/b', '../chat?x'),
    'wss://base.example/chat?x',
    'relative paths keep the base host'
  )
  t.equal(
    fastURI.resolve('ws://base.example/', 'wss://other.example'),
    'wss://other.example',
    'an absolute WebSocket reference with a host remains valid'
  )
})

test('equal compares hostless WebSocket URIs like hostless HTTP URIs', (t) => {
  // A missing host is a scheme-level error, not a syntactic one, so equal()
  // still compares the normalized strings, matching http and https.
  for (const uri of ['ws:/a', 'wss:/a', 'ws:///a', 'wss:a', 'http:/a', 'https:///a']) {
    t.ok(fastURI.parse(uri).error, `${uri} reports an error`)
    t.equal(fastURI.equal(uri, uri), true, `${uri} equals itself`)
  }
  t.equal(fastURI.equal('ws:/a', 'ws:/b'), false, 'different hostless paths are not equal')
  t.end()
})

test('structured WebSocket components still serialize without a host', (t) => {
  t.equal(fastURI.serialize({ scheme: 'ws', resourceName: '/chat' }), 'ws:/chat')
  t.equal(fastURI.serialize({ scheme: 'wss' }), 'wss:')
  t.end()
})

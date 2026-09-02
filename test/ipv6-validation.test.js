'use strict'

const test = require('tape')
const fastURI = require('..')

const HOST_ERROR = 'URI host is malformed.'

test('hosts with unbalanced or misplaced IP-literal brackets are rejected', (t) => {
  const malformed = [
    'http://[fe80',
    'http://[',
    'http://[not-an-ip',
    'http://[\u65e5\u672c',
    'http://user@[@127.0.0.1:8123/admin',
    'http://user@]127.0.0.1:8123/admin',
    'http://user@prefix[@127.0.0.1:8123/admin',
    'http://user@prefix]@127.0.0.1:8123/admin'
  ]
  const modes = [
    ['default', undefined],
    ['Unicode', { unicodeSupport: true }]
  ]

  for (const [mode, options] of modes) {
    for (const uri of malformed) {
      const parsed = fastURI.parse(uri, options)
      const message = `${mode} mode rejects ${uri}`

      t.equal(parsed.error, HOST_ERROR, `parse ${message}`)
      t.equal(fastURI.normalize(uri, options), uri, `normalize preserves ${uri} in ${mode} mode`)
      t.equal(fastURI.equal(uri, uri, options), false, `equal ${message}`)
      t.throws(
        () => fastURI.resolve('http://example.com/', uri, options),
        /URI host is malformed\./,
        `resolve ${message}`
      )
    }
  }
  t.end()
})

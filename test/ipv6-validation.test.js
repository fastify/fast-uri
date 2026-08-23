'use strict'

const test = require('tape')
const fastURI = require('..')

test('unterminated bracket hosts are not treated as IP literals', (t) => {
  const unterminated = [
    'http://[fe80',
    'http://[',
    'http://[not-an-ip',
    'http://[\u65e5\u672c'
  ]

  for (const uri of unterminated) {
    const parsed = fastURI.parse(uri)
    t.ok(parsed.error, `parse rejects ${uri}`)
    t.equal(fastURI.normalize(uri), uri, `normalize preserves ${uri}`)
  }
  t.end()
})

'use strict'

const test = require('tape')
const fastURI = require('..')

function encodeCharacter (value, index, lowercaseHex) {
  let hex = value.charCodeAt(index).toString(16)
  if (!lowercaseHex) hex = hex.toUpperCase()
  return value.slice(0, index) + '%' + hex + value.slice(index + 1)
}

function mailtoState (component) {
  return {
    to: component.to,
    subject: component.subject,
    body: component.body,
    headers: component.headers && { ...component.headers }
  }
}

test('mailto parsing classifies decoded, case-insensitive reserved field names', (t) => {
  const cases = [
    { name: 'to', value: 'attacker@evil.test', property: 'to' },
    { name: 'subject', value: 'injected subject', property: 'subject' },
    { name: 'body', value: 'injected body', property: 'body' }
  ]

  for (const entry of cases) {
    const variants = new Set([entry.name.toUpperCase()])
    for (let i = 0; i < entry.name.length; i++) {
      variants.add(encodeCharacter(entry.name, i, false))
      variants.add(encodeCharacter(entry.name, i, true))
    }

    for (const name of variants) {
      const parsed = fastURI.parse(`mailto:alice@example.test?${name}=${entry.value}`)
      if (entry.property === 'to') {
        t.deepEqual(parsed.to, ['alice@example.test', entry.value], name + ' is classified as a recipient')
      } else {
        t.equal(parsed[entry.property], entry.value, name + ' is classified as ' + entry.property)
      }
      t.equal(parsed.headers, undefined, name + ' is not exposed as a generic header')

      const reparsed = fastURI.parse(fastURI.serialize(parsed))
      t.deepEqual(mailtoState(reparsed), mailtoState(parsed), name + ' keeps its meaning after a roundtrip')
    }
  }

  t.end()
})

test('mailto generic field names are decoded exactly once across roundtrips', (t) => {
  const cases = [
    ['%2574o', '%74o'],
    ['%2573ubject', '%73ubject'],
    ['%2562ody', '%62ody'],
    ['x%2520y', 'x%20y'],
    ['%26to', '&to'],
    ['%25GGto', '%GGto']
  ]

  for (const [encodedName, decodedName] of cases) {
    let serialized = `mailto:alice@example.test?${encodedName}=value`
    for (let round = 0; round < 3; round++) {
      const parsed = fastURI.parse(serialized)
      t.deepEqual({ ...parsed.headers }, { [decodedName]: 'value' }, encodedName + ' stays generic in round ' + round)
      t.deepEqual(parsed.to, ['alice@example.test'], encodedName + ' does not add a recipient in round ' + round)
      t.equal(parsed.subject, undefined, encodedName + ' does not set a subject in round ' + round)
      t.equal(parsed.body, undefined, encodedName + ' does not set a body in round ' + round)
      serialized = fastURI.serialize(parsed)
    }
    t.equal(serialized, `mailto:alice@example.test?${encodedName}=value`, encodedName + ' serializes idempotently')
  }

  t.equal(
    fastURI.serialize({ scheme: 'mailto', to: ['alice@example.test'], headers: { '%74o': 'value' } }),
    'mailto:alice@example.test?%2574o=value',
    'a percent sequence in a decoded component key is encoded as data'
  )
  t.end()
})

test('mailto serialization canonicalizes reserved generic header names', (t) => {
  const serialized = fastURI.serialize({
    scheme: 'mailto',
    to: ['alice@example.test'],
    subject: 'safe subject',
    body: 'safe body',
    headers: {
      TO: 'attacker@evil.test',
      Subject: 'hidden subject',
      BODY: 'hidden body',
      cc: 'copy@example.test'
    }
  })

  t.equal(
    serialized,
    'mailto:alice@example.test,attacker@evil.test?subject=safe%20subject&body=safe%20body&cc=copy@example.test',
    'dedicated properties override header variants and all recipients are visible in the path'
  )

  const parsed = fastURI.parse(serialized)
  t.deepEqual(parsed.to, ['alice@example.test', 'attacker@evil.test'], 'canonical recipients are classified consistently')
  t.equal(parsed.subject, 'safe subject', 'the dedicated subject wins')
  t.equal(parsed.body, 'safe body', 'the dedicated body wins')
  t.deepEqual({ ...parsed.headers }, { cc: 'copy@example.test' }, 'only generic headers remain generic')

  const empty = fastURI.serialize({
    scheme: 'mailto',
    to: ['alice@example.test'],
    subject: '',
    body: '',
    headers: { Subject: 'hidden subject', BODY: 'hidden body' }
  })
  t.equal(empty, 'mailto:alice@example.test?subject=&body=', 'explicit empty properties override header variants')
  const emptyParsed = fastURI.parse(empty)
  t.equal(emptyParsed.subject, '', 'an empty subject round-trips')
  t.equal(emptyParsed.body, '', 'an empty body round-trips')
  t.end()
})

test('mailto duplicate reserved fields have deterministic parsing semantics', (t) => {
  const parsed = fastURI.parse(
    'mailto:alice@example.test?subject=first&%53UBJECT=last&body=first&%42ODY=last&to=one@example.test&%54O=two@example.test'
  )

  t.equal(parsed.subject, 'last', 'the last subject wins')
  t.equal(parsed.body, 'last', 'the last body wins')
  t.deepEqual(
    parsed.to,
    ['alice@example.test', 'one@example.test', 'two@example.test'],
    'all recipient fields are accumulated'
  )
  t.equal(parsed.headers, undefined, 'no reserved spelling remains generic')
  t.end()
})

test('encoded reserved field names expose decoded control characters immediately', (t) => {
  const input = 'mailto:alice@example.test?%73ubject=hello%0D%0Aworld'
  const parsed = fastURI.parse(input)

  t.equal(parsed.subject, 'hello\r\nworld', 'the first parse exposes CRLF in the dedicated property')
  t.equal(parsed.headers, undefined, 'the subject is not hidden as a generic header')
  t.equal(
    fastURI.parse(fastURI.serialize(parsed)).subject,
    parsed.subject,
    'the decoded subject remains stable after a roundtrip'
  )
  t.end()
})

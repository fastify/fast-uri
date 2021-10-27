'use strict'

const tap = require('tap')
const test = tap.test
const URI = require('../')

test('URI parse', (t) => {
  let components

  // scheme
  components = URI.parse('uri:')
  t.equal(components.error, undefined, 'scheme errors')
  t.equal(components.scheme, 'uri', 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // userinfo
  components = URI.parse('//@')
  t.equal(components.error, undefined, 'userinfo errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, "@", "authority");
  t.equal(components.userinfo, '', 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // host
  components = URI.parse('//')
  t.equal(components.error, undefined, 'host errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, "", "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // port
  components = URI.parse('//:')
  t.equal(components.error, undefined, 'port errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, ":", "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '', 'host')
  t.equal(components.port, '', 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // path
  components = URI.parse('')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // query
  components = URI.parse('?')
  t.equal(components.error, undefined, 'query errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, '', 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // fragment
  components = URI.parse('#')
  t.equal(components.error, undefined, 'fragment errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '', 'fragment')

  // fragment with character tabulation
  components = URI.parse('#\t')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%09', 'fragment')

  // fragment with line feed
  components = URI.parse('#\n')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0A', 'fragment')

  // fragment with line tabulation
  components = URI.parse('#\v')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0B', 'fragment')

  // fragment with form feed
  components = URI.parse('#\f')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0C', 'fragment')

  // fragment with carriage return
  components = URI.parse('#\r')
  t.equal(components.error, undefined, 'path errors')
  t.equal(components.scheme, undefined, 'scheme')
  // t.equal(components.authority, undefined, "authority");
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, undefined, 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, '%0D', 'fragment')

  // all
  components = URI.parse('uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body')
  t.equal(components.error, undefined, 'all errors')
  t.equal(components.scheme, 'uri', 'scheme')
  // t.equal(components.authority, "user:pass@example.com:123", "authority");
  t.equal(components.userinfo, 'user:pass', 'userinfo')
  t.equal(components.host, 'example.com', 'host')
  t.equal(components.port, 123, 'port')
  t.equal(components.path, '/one/two.three', 'path')
  t.equal(components.query, 'q1=a1&q2=a2', 'query')
  t.equal(components.fragment, 'body', 'fragment')

  // IPv4address
  components = URI.parse('//10.10.10.10')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.10.10', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv4address with unformated 0
  components = URI.parse('//10.10.000.10')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.0.10', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address
  components = URI.parse('//[2001:db8::7]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::7', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // mixed IPv4address & IPv6address
  components = URI.parse('//[::ffff:129.144.52.38]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '::ffff:129.144.52.38', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
  components = URI.parse('uri://10.10.10.10.example.com/en/process')
  t.equal(components.error, undefined, 'mixed errors')
  t.equal(components.scheme, 'uri', 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '10.10.10.10.example.com', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '/en/process', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address, example from bkw (https://github.com/garycourt/uri-js/pull/16)
  components = URI.parse('//[2606:2800:220:1:248:1893:25c8:1946]/test')
  t.equal(components.error, undefined, 'IPv6address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2606:2800:220:1:248:1893:25c8:1946', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '/test', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address, example from RFC 5952
  components = URI.parse('//[2001:db8::1]:80')
  t.equal(components.error, undefined, 'IPv6address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::1', 'host')
  t.equal(components.port, 80, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address with zone identifier, RFC 6874
  components = URI.parse('//[fe80::a%25en1]')
  t.equal(components.error, undefined, 'IPv4address errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, 'fe80::a%en1', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // IPv6address with an unescaped interface specifier, example from pekkanikander (https://github.com/garycourt/uri-js/pull/22)
  components = URI.parse('//[2001:db8::7%en0]')
  t.equal(components.error, undefined, 'IPv6address interface errors')
  t.equal(components.scheme, undefined, 'scheme')
  t.equal(components.userinfo, undefined, 'userinfo')
  t.equal(components.host, '2001:db8::7%en0', 'host')
  t.equal(components.port, undefined, 'port')
  t.equal(components.path, '', 'path')
  t.equal(components.query, undefined, 'query')
  t.equal(components.fragment, undefined, 'fragment')

  // example from RFC 4122
  // components = URI.parse('urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6')
  // t.equal(components.error, undefined, 'errors')
  // t.equal(components.scheme, 'urn', 'scheme')
  // // t.equal(components.authority, undefined, "authority");
  // t.equal(components.userinfo, undefined, 'userinfo')
  // t.equal(components.host, undefined, 'host')
  // t.equal(components.port, undefined, 'port')
  // t.equal(components.path, undefined, 'path')
  // t.equal(components.query, undefined, 'query')
  // t.equal(components.fragment, undefined, 'fragment')
  // t.equal(components.nid, 'uuid', 'nid')
  // t.equal(components.nss, undefined, 'nss')
  // t.equal(components.uuid, 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', 'uuid')

  // components = URI.parse('urn:uuid:notauuid-7dec-11d0-a765-00a0c91e6bf6')
  // t.notSame(components.error, undefined, 'errors')

  // components = URI.parse('urn:foo:a123,456')
  // t.equal(components.error, undefined, 'errors')
  // t.equal(components.scheme, 'urn', 'scheme')
  // // t.equal(components.authority, undefined, "authority");
  // t.equal(components.userinfo, undefined, 'userinfo')
  // t.equal(components.host, undefined, 'host')
  // t.equal(components.port, undefined, 'port')
  // t.equal(components.path, undefined, 'path')
  // t.equal(components.query, undefined, 'query')
  // t.equal(components.fragment, undefined, 'fragment')
  // t.equal(components.nid, 'foo', 'nid')
  // t.equal(components.nss, 'a123,456', 'nss')

  t.end()
})

test('URI Serialize', (t) => {
  let components = {
    scheme: undefined,
    userinfo: undefined,
    host: undefined,
    port: undefined,
    path: undefined,
    query: undefined,
    fragment: undefined
  }
  t.equal(URI.serialize(components), '', 'Undefined Components')

  components = {
    scheme: '',
    userinfo: '',
    host: '',
    port: 0,
    path: '',
    query: '',
    fragment: ''
  }
  t.equal(URI.serialize(components), '//@:0?#', 'Empty Components')

  components = {
    scheme: 'uri',
    userinfo: 'foo:bar',
    host: 'example.com',
    port: 1,
    path: 'path',
    query: 'query',
    fragment: 'fragment'
  }
  t.equal(URI.serialize(components), 'uri://foo:bar@example.com:1/path?query#fragment', 'All Components')

  components = {
    scheme: 'uri',
    host: 'example.com',
    port: '9000'
  }
  t.equal(URI.serialize(components), 'uri://example.com:9000', 'String port')

  t.equal(URI.serialize({ path: '//path' }), '/%2Fpath', 'Double slash path')
  t.equal(URI.serialize({ path: 'foo:bar' }), 'foo%3Abar', 'Colon path')
  t.equal(URI.serialize({ path: '?query' }), '%3Fquery', 'Query path')

  t.equal(URI.serialize({ host: '10.10.10.10' }), '//10.10.10.10', 'IPv4address')

  // mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
  t.equal(URI.serialize({ host: '10.10.10.10.example.com' }), '//10.10.10.10.example.com', 'Mixed IPv4address & reg-name')

  // IPv6address
  t.equal(URI.serialize({ host: '2001:db8::7' }), '//[2001:db8::7]', 'IPv6 Host')
  t.equal(URI.serialize({ host: '::ffff:129.144.52.38' }), '//[::ffff:129.144.52.38]', 'IPv6 Mixed Host')
  t.equal(URI.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' }), '//[2606:2800:220:1:248:1893:25c8:1946]', 'IPv6 Full Host')

  // IPv6address with zone identifier, RFC 6874
  t.equal(URI.serialize({ host: 'fe80::a%en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Unescaped Host')
  t.equal(URI.serialize({ host: 'fe80::a%25en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Escaped Host')

  t.end()
})

test('WS serialize', (t) => {
  t.equal(URI.serialize({ scheme: 'ws' }), 'ws:')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com' }), 'ws://example.com')
  t.equal(URI.serialize({ scheme: 'ws', resourceName: '/' }), 'ws:')
  t.equal(URI.serialize({ scheme: 'ws', resourceName: '/foo' }), 'ws:/foo')
  t.equal(URI.serialize({ scheme: 'ws', resourceName: '/foo?bar' }), 'ws:/foo?bar')
  t.equal(URI.serialize({ scheme: 'ws', secure: false }), 'ws:')
  t.equal(URI.serialize({ scheme: 'ws', secure: true }), 'wss:')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo' }), 'ws://example.com/foo')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar' }), 'ws://example.com/foo?bar')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', secure: false }), 'ws://example.com')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', secure: true }), 'wss://example.com')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: false }), 'ws://example.com/foo?bar')
  t.equal(URI.serialize({ scheme: 'ws', host: 'example.com', resourceName: '/foo?bar', secure: true }), 'wss://example.com/foo?bar')
  t.end()
})

test('WSS serialize', (t) => {
  t.equal(URI.serialize({ scheme: 'wss' }), 'wss:')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com' }), 'wss://example.com')
  t.equal(URI.serialize({ scheme: 'wss', resourceName: '/' }), 'wss:')
  t.equal(URI.serialize({ scheme: 'wss', resourceName: '/foo' }), 'wss:/foo')
  t.equal(URI.serialize({ scheme: 'wss', resourceName: '/foo?bar' }), 'wss:/foo?bar')
  t.equal(URI.serialize({ scheme: 'wss', secure: false }), 'ws:')
  t.equal(URI.serialize({ scheme: 'wss', secure: true }), 'wss:')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo' }), 'wss://example.com/foo')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar' }), 'wss://example.com/foo?bar')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', secure: false }), 'ws://example.com')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', secure: true }), 'wss://example.com')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar', secure: false }), 'ws://example.com/foo?bar')
  t.equal(URI.serialize({ scheme: 'wss', host: 'example.com', resourceName: '/foo?bar', secure: true }), 'wss://example.com/foo?bar')

  t.end()
})
test("URI Resolving", (t)=> {
	//normal examples from RFC 3986
	let base = "uri://a/b/c/d;p?q";
	t.equal(URI.resolve(base, "g:h"), "g:h", "g:h");
	t.equal(URI.resolve(base, "g:h"), "g:h", "g:h");
	t.equal(URI.resolve(base, "g"), "uri://a/b/c/g", "g");
	t.equal(URI.resolve(base, "./g"), "uri://a/b/c/g", "./g");
	t.equal(URI.resolve(base, "g/"), "uri://a/b/c/g/", "g/");
	t.equal(URI.resolve(base, "/g"), "uri://a/g", "/g");
	t.equal(URI.resolve(base, "//g"), "uri://g", "//g");
	t.equal(URI.resolve(base, "?y"), "uri://a/b/c/d;p?y", "?y");
	t.equal(URI.resolve(base, "g?y"), "uri://a/b/c/g?y", "g?y");
	t.equal(URI.resolve(base, "#s"), "uri://a/b/c/d;p?q#s", "#s");
	t.equal(URI.resolve(base, "g#s"), "uri://a/b/c/g#s", "g#s");
	t.equal(URI.resolve(base, "g?y#s"), "uri://a/b/c/g?y#s", "g?y#s");
	t.equal(URI.resolve(base, ";x"), "uri://a/b/c/;x", ";x");
	t.equal(URI.resolve(base, "g;x"), "uri://a/b/c/g;x", "g;x");
	t.equal(URI.resolve(base, "g;x?y#s"), "uri://a/b/c/g;x?y#s", "g;x?y#s");
	t.equal(URI.resolve(base, ""), "uri://a/b/c/d;p?q", "");
	t.equal(URI.resolve(base, "."), "uri://a/b/c/", ".");
	t.equal(URI.resolve(base, "./"), "uri://a/b/c/", "./");
	t.equal(URI.resolve(base, ".."), "uri://a/b/", "..");
	t.equal(URI.resolve(base, "../"), "uri://a/b/", "../");
	t.equal(URI.resolve(base, "../g"), "uri://a/b/g", "../g");
	t.equal(URI.resolve(base, "../.."), "uri://a/", "../..");
	t.equal(URI.resolve(base, "../../"), "uri://a/", "../../");
	t.equal(URI.resolve(base, "../../g"), "uri://a/g", "../../g");

	//abnormal examples from RFC 3986
	t.equal(URI.resolve(base, "../../../g"), "uri://a/g", "../../../g");
	t.equal(URI.resolve(base, "../../../../g"), "uri://a/g", "../../../../g");

	t.equal(URI.resolve(base, "/./g"), "uri://a/g", "/./g");
	t.equal(URI.resolve(base, "/../g"), "uri://a/g", "/../g");
	t.equal(URI.resolve(base, "g."), "uri://a/b/c/g.", "g.");
	t.equal(URI.resolve(base, ".g"), "uri://a/b/c/.g", ".g");
	t.equal(URI.resolve(base, "g.."), "uri://a/b/c/g..", "g..");
	t.equal(URI.resolve(base, "..g"), "uri://a/b/c/..g", "..g");

	t.equal(URI.resolve(base, "./../g"), "uri://a/b/g", "./../g");
	t.equal(URI.resolve(base, "./g/."), "uri://a/b/c/g/", "./g/.");
	t.equal(URI.resolve(base, "g/./h"), "uri://a/b/c/g/h", "g/./h");
	t.equal(URI.resolve(base, "g/../h"), "uri://a/b/c/h", "g/../h");
	t.equal(URI.resolve(base, "g;x=1/./y"), "uri://a/b/c/g;x=1/y", "g;x=1/./y");
	t.equal(URI.resolve(base, "g;x=1/../y"), "uri://a/b/c/y", "g;x=1/../y");

	t.equal(URI.resolve(base, "g?y/./x"), "uri://a/b/c/g?y/./x", "g?y/./x");
	t.equal(URI.resolve(base, "g?y/../x"), "uri://a/b/c/g?y/../x", "g?y/../x");
	t.equal(URI.resolve(base, "g#s/./x"), "uri://a/b/c/g#s/./x", "g#s/./x");
	t.equal(URI.resolve(base, "g#s/../x"), "uri://a/b/c/g#s/../x", "g#s/../x");

	t.equal(URI.resolve(base, "uri:g"), "uri:g", "uri:g");
	t.equal(URI.resolve(base, "uri:g", {tolerant:true}), "uri://a/b/c/g", "uri:g");

	//examples by PAEz
	t.equal(URI.resolve("//www.g.com/","/adf\ngf"), "//www.g.com/adf%0Agf", "/adf\\ngf");
	t.equal(URI.resolve("//www.g.com/error\n/bleh/bleh",".."), "//www.g.com/error%0A/", "//www.g.com/error\\n/bleh/bleh");
  t.end()
});

test("URN Resolving",(t) => {
  //example from epoberezkin
  t.equal(URI.resolve('', 'urn:some:ip:prop'), 'urn:some:ip:prop','urn:some:ip:prop');
  t.equal(URI.resolve('#', 'urn:some:ip:prop'), 'urn:some:ip:prop','urn:some:ip:prop');
  t.equal(URI.resolve('urn:some:ip:prop', 'urn:some:ip:prop'), 'urn:some:ip:prop','urn:some:ip:prop');
  t.equal(URI.resolve('urn:some:other:prop', 'urn:some:ip:prop'), 'urn:some:ip:prop','urn:some:ip:prop');
  t.end()
});
// test('Escape Component', (t) => {
//   let chr
//   for (let d = 0; d <= 129; ++d) {
//     chr = String.fromCharCode(d)
//     if (!chr.match(/[$&+,;=]/)) {
//       t.equal(URI.escapeComponent(chr), encodeURIComponent(chr))
//     } else {
//       t.equal(URI.escapeComponent(chr), chr)
//     }
//   }
//   t.equal(URI.escapeComponent('\u00c0'), encodeURIComponent('\u00c0'))
//   t.equal(URI.escapeComponent('\u07ff'), encodeURIComponent('\u07ff'))
//   t.equal(URI.escapeComponent('\u0800'), encodeURIComponent('\u0800'))
//   t.equal(URI.escapeComponent('\u30a2'), encodeURIComponent('\u30a2'))
// })
//
// test('Unescape Component', (t) => {
//   let chr
//   for (let d = 0; d <= 129; ++d) {
//     chr = String.fromCharCode(d)
//     t.equal(URI.unescapeComponent(encodeURIComponent(chr)), chr)
//   }
//   t.equal(URI.unescapeComponent(encodeURIComponent('\u00c0')), '\u00c0')
//   t.equal(URI.unescapeComponent(encodeURIComponent('\u07ff')), '\u07ff')
//   t.equal(URI.unescapeComponent(encodeURIComponent('\u0800')), '\u0800')
//   t.equal(URI.unescapeComponent(encodeURIComponent('\u30a2')), '\u30a2')
// })
//
// test('URI Serialization', (t) => {
//   let components = {
//     scheme: undefined,
//     userinfo: undefined,
//     host: undefined,
//     port: undefined,
//     path: undefined,
//     query: undefined,
//     fragment: undefined
//   }
//   t.equal(URI.serialize(components), '', 'Undefined Components')
//
//   components = {
//     scheme: '',
//     userinfo: '',
//     host: '',
//     port: 0,
//     path: '',
//     query: '',
//     fragment: ''
//   }
//   t.equal(URI.serialize(components), '//@:0?#', 'Empty Components')
//
//   components = {
//     scheme: 'uri',
//     userinfo: 'foo:bar',
//     host: 'example.com',
//     port: 1,
//     path: 'path',
//     query: 'query',
//     fragment: 'fragment'
//   }
//   t.equal(URI.serialize(components), 'uri://foo:bar@example.com:1/path?query#fragment', 'All Components')
//
//   components = {
//     scheme: 'uri',
//     host: 'example.com',
//     port: '9000'
//   }
//   t.equal(URI.serialize(components), 'uri://example.com:9000', 'String port')
//
//   t.equal(URI.serialize({ path: '//path' }), '/%2Fpath', 'Double slash path')
//   t.equal(URI.serialize({ path: 'foo:bar' }), 'foo%3Abar', 'Colon path')
//   t.equal(URI.serialize({ path: '?query' }), '%3Fquery', 'Query path')
//
//   // mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
//   t.equal(URI.serialize({ host: '10.10.10.10.example.com' }), '//10.10.10.10.example.com', 'Mixed IPv4address & reg-name')
//
//   // IPv6address
//   t.equal(URI.serialize({ host: '2001:db8::7' }), '//[2001:db8::7]', 'IPv6 Host')
//   t.equal(URI.serialize({ host: '::ffff:129.144.52.38' }), '//[::ffff:129.144.52.38]', 'IPv6 Mixed Host')
//   t.equal(URI.serialize({ host: '2606:2800:220:1:248:1893:25c8:1946' }), '//[2606:2800:220:1:248:1893:25c8:1946]', 'IPv6 Full Host')
//
//   // IPv6address with zone identifier, RFC 6874
//   t.equal(URI.serialize({ host: 'fe80::a%en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Unescaped Host')
//   t.equal(URI.serialize({ host: 'fe80::a%25en1' }), '//[fe80::a%25en1]', 'IPv6 Zone Escaped Host')
// })
// test('HTTP Equals', (t) => {
//   // test from RFC 2616
//   t.equal(URI.equal('http://abc.com:80/~smith/home.html', 'http://abc.com/~smith/home.html'), true)
//   t.equal(URI.equal('http://ABC.com/%7Esmith/home.html', 'http://abc.com/~smith/home.html'), true)
//   t.equal(URI.equal('http://ABC.com:/%7esmith/home.html', 'http://abc.com/~smith/home.html'), true)
//   t.equal(URI.equal('HTTP://ABC.COM', 'http://abc.com/'), true)
//   // test from RFC 3986
//   t.equal(URI.equal('http://example.com:/', 'http://example.com:80/'), true)
// })
//
// test('HTTPS Equals', (t) => {
//   t.equal(URI.equal('https://example.com', 'https://example.com:443/'), true)
//   t.equal(URI.equal('https://example.com:/', 'https://example.com:443/'), true)
// })
//

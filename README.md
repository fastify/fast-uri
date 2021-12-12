# fast-uri

<div align="center">

[![CI](https://github.com/fastify/fastify/workflows/ci/badge.svg)](https://github.com/fastify/fast-uri/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/fastify/fast-uri/badge.svg?branch=add_coveralls)](https://coveralls.io/github/fastify/fast-uri?branch=main)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

</div>

Dependency free RFC 3986 URI toolbox.

## Usage

## Options

All of the above functions can accept an additional options argument that is an object that can contain one or more of the following properties:

*	`scheme` (string)
	Indicates the scheme that the URI should be treated as, overriding the URI's normal scheme parsing behavior.

*	`reference` (string)
	If set to `"suffix"`, it indicates that the URI is in the suffix format and the parser will use the option's `scheme` property to determine the URI's scheme.

*	`tolerant` (boolean, false)
	If set to `true`, the parser will relax URI resolving rules.

*	`absolutePath` (boolean, false)
	If set to `true`, the serializer will not resolve a relative `path` component.

*	`unicodeSupport` (boolean, false)
	If set to `true`, the parser will unescape non-ASCII characters in the parsed output as per [RFC 3987](http://www.ietf.org/rfc/rfc3987.txt).

*	`domainHost` (boolean, false)
	If set to `true`, the library will treat the `host` component as a domain name, and convert IDNs (International Domain Names) as per [RFC 5891](http://www.ietf.org/rfc/rfc5891.txt).

### Parse

```js
const uri = require('fast-uri')
uri.parse('uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body')
// Output
{
  scheme : "uri",
  userinfo : "user:pass",
  host : "example.com",
  port : 123,
  path : "/one/two.three",
  query : "q1=a1&q2=a2",
  fragment : "body"
}
```

### Serialize

```js
const uri = require('fast-uri')
uri.serialize({scheme : "http", host : "example.com", fragment : "footer"})
// Output
"http://example.com/#footer"

```

### Resolve

```js
const uri = require('fast-uri')
uri.resolve("uri://a/b/c/d?q", "../../g") 
// Output
"uri://a/g"
```

### Equal

```js
const uri = require('fast-uri')
uri.equal("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d")
// Output
true
```

## Scheme supports

fast-uri supports inserting custom [scheme](http://en.wikipedia.org/wiki/URI_scheme) dependent processing rules. Currently, fast-uri has built in support for the following schemes:

*	http \[[RFC 2616](http://www.ietf.org/rfc/rfc2616.txt)\]
*	https \[[RFC 2818](http://www.ietf.org/rfc/rfc2818.txt)\]
*	ws \[[RFC 6455](http://www.ietf.org/rfc/rfc6455.txt)\]
*	wss \[[RFC 6455](http://www.ietf.org/rfc/rfc6455.txt)\]
*	urn \[[RFC 2141](http://www.ietf.org/rfc/rfc2141.txt)\]
*	urn:uuid \[[RFC 4122](http://www.ietf.org/rfc/rfc4122.txt)\]


## Benchmarks

```
fast-uri: parse domain x 1,344,963 ops/sec ±0.31% (99 runs sampled)
urijs: parse domain x 485,273 ops/sec ±0.20% (98 runs sampled)
fast-uri: parse IPv4 x 2,429,284 ops/sec ±0.18% (98 runs sampled)
urijs: parse IPv4 x 391,142 ops/sec ±0.11% (99 runs sampled)
fast-uri: parse IPv6 x 948,434 ops/sec ±0.35% (100 runs sampled)
urijs: parse IPv6 x 293,538 ops/sec ±0.09% (97 runs sampled)
fast-uri: parse URN x 2,639,216 ops/sec ±0.10% (99 runs sampled)
urijs: parse URN x 1,175,357 ops/sec ±0.36% (95 runs sampled)
fast-uri: parse URN uuid x 1,654,986 ops/sec ±0.15% (97 runs sampled)
urijs: parse URN uuid x 870,033 ops/sec ±0.43% (96 runs sampled)
fast-uri: serialize uri x 1,804,227 ops/sec ±0.26% (100 runs sampled)
urijs: serialize uri x 394,736 ops/sec ±0.21% (99 runs sampled)
fast-uri: serialize IPv6 x 451,489 ops/sec ±0.11% (100 runs sampled)
urijs: serialize IPv6 x 263,908 ops/sec ±0.13% (99 runs sampled)
fast-uri: serialize ws x 1,412,927 ops/sec ±0.49% (96 runs sampled)
urijs: serialize ws x 353,774 ops/sec ±0.17% (99 runs sampled)
fast-uri: resolve x 350,311 ops/sec ±0.96% (97 runs sampled)
urijs: resolve x 228,281 ops/sec ±0.18% (100 runs sampled)
```

## TODO

- [ ] Support MailTo
- [ ] Be 100% iso compatible with uri-js
- [ ] Add browser test stack
# @fastify/fast-uri

Dependency free RFC 3986 URI toolbox.

## Benchmarks

```
fastURI: parse domain x 1,252,422 ops/sec ±0.28% (97 runs sampled)
urijs: parse domain x 472,949 ops/sec ±0.10% (100 runs sampled)
fastURI: parse IPv4 x 2,153,692 ops/sec ±0.26% (99 runs sampled)
urijs: parse IPv4 x 380,838 ops/sec ±0.08% (101 runs sampled)
fastURI: parse IPv6 x 882,304 ops/sec ±0.40% (96 runs sampled)
urijs: parse IPv6 x 289,684 ops/sec ±0.09% (98 runs sampled)
fastURI: serialize uri x 1,799,121 ops/sec ±0.12% (100 runs sampled)
urijs: serialize uri x 387,358 ops/sec ±0.41% (100 runs sampled)
fastURI: serialize IPv6 x 444,688 ops/sec ±0.14% (100 runs sampled)
urijs: serialize IPv6 x 262,238 ops/sec ±0.50% (97 runs sampled)
fastURI: serialize ws x 28,989 ops/sec ±0.19% (99 runs sampled)
urijs: serialize ws x 349,650 ops/sec ±0.08% (95 runs sampled)
fast-uri: resolve x 343,607 ops/sec ±0.94% (97 runs sampled)
urijs: resolve x 223,666 ops/sec ±0.44% (93 runs sampled)
```

## TODO

- [ ] Support URN
- [ ] Support MailTo
- [ ] Be 100% iso compatible with uri-js
- [ ] Be faster
- [ ] Add browser test stack
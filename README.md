# fast-uri

Dependency free RFC 3986 URI toolbox.

## Benchmarks

```
fastURI: parse domain x 1,247,726 ops/sec ±0.32% (97 runs sampled)
urijs: parse domain x 488,006 ops/sec ±0.11% (97 runs sampled)
fastURI: parse IPv4 x 2,195,254 ops/sec ±0.19% (98 runs sampled)
urijs: parse IPv4 x 387,909 ops/sec ±0.13% (97 runs sampled)
fastURI: parse IPv6 x 884,259 ops/sec ±0.36% (99 runs sampled)
urijs: parse IPv6 x 289,415 ops/sec ±0.12% (100 runs sampled)
fastURI: serialize uri x 1,784,977 ops/sec ±0.15% (98 runs sampled)
urijs: serialize uri x 392,667 ops/sec ±0.37% (96 runs sampled)
fastURI: serialize IPv6 x 452,999 ops/sec ±0.15% (101 runs sampled)
urijs: serialize IPv6 x 259,007 ops/sec ±0.59% (93 runs sampled)
fastURI: serialize ws x 1,439,760 ops/sec ±0.10% (99 runs sampled)
urijs: serialize ws x 346,635 ops/sec ±0.16% (97 runs sampled)
fast-uri: resolve x 342,474 ops/sec ±0.97% (99 runs sampled)
urijs: resolve x 227,312 ops/sec ±0.46% (100 runs sampled)
```

## TODO

- [ ] Support URN
- [ ] Support MailTo
- [ ] Be 100% iso compatible with uri-js
- [ ] Add browser test stack
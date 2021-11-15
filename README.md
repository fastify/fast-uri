# fast-uri

Dependency free RFC 3986 URI toolbox.

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
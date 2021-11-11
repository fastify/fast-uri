# fast-uri

Dependency free RFC 3986 URI toolbox.

## Benchmarks

```
fast-uri: parse domain x 1,230,754 ops/sec ±0.29% (99 runs sampled)
urijs: parse domain x 466,860 ops/sec ±0.09% (99 runs sampled)
fast-uri: parse IPv4 x 2,106,681 ops/sec ±0.16% (101 runs sampled)
urijs: parse IPv4 x 380,687 ops/sec ±0.10% (100 runs sampled)
fast-uri: parse IPv6 x 881,292 ops/sec ±0.36% (98 runs sampled)
urijs: parse IPv6 x 279,647 ops/sec ±0.09% (99 runs sampled)
fast-uri: parse URN x 1,820,330 ops/sec ±0.22% (100 runs sampled)
urijs: parse URN x 1,167,246 ops/sec ±0.36% (99 runs sampled)
fast-uri: parse URN uuid x 368,269 ops/sec ±0.17% (99 runs sampled)
urijs: parse URN uuid x 860,127 ops/sec ±0.43% (100 runs sampled)
fast-uri: serialize uri x 1,800,826 ops/sec ±0.07% (97 runs sampled)
urijs: serialize uri x 396,666 ops/sec ±0.13% (95 runs sampled)
fast-uri: serialize IPv6 x 446,628 ops/sec ±0.47% (99 runs sampled)
urijs: serialize IPv6 x 254,256 ops/sec ±0.27% (99 runs sampled)
fast-uri: serialize ws x 1,461,041 ops/sec ±0.09% (100 runs sampled)
urijs: serialize ws x 344,027 ops/sec ±0.50% (100 runs sampled)
fast-uri: resolve x 333,742 ops/sec ±0.97% (98 runs sampled)
urijs: resolve x 224,724 ops/sec ±0.10% (100 runs sampled)
```

## TODO

- [ ] Support MailTo
- [ ] Be 100% iso compatible with uri-js
- [ ] Add browser test stack
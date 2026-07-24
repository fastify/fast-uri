# Security Policy

## Standards and scope

`fast-uri` implements URI parsing and normalization according to
[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986). It does not implement the
[WHATWG URL Standard](https://url.spec.whatwg.org/).

Differences between `fast-uri` and WHATWG URL implementations are expected.
Reports based on comparing or mixing parsers that follow these different
standards are out of scope. Applications must use the same parsing and
normalization rules for both security decisions and subsequent URI use.

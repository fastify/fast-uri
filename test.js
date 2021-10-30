
const URI = require('./')

const urijs = require('uri-js')

console.log(URI.parse('http://user:pass@example.com:123/one/space in.url?q1=a1&q2=a2#bodyp'))
console.log(urijs.parse('http://user:pass@example.com:123/one/space in.url?q1=a1&q2=a2#body'))
console.log(URI.parse('//www.g.com/error\n/bleh/bleh'))
console.log(urijs.parse('//www.g.com/error\n/bleh/bleh'))

console.log(URI.serialize(URI.parse('https://example.com')))
console.log(urijs.serialize(urijs.parse('https://example.com')))
console.log(URI.serialize(URI.parse('https://example.com?foo=bar')))
console.log(urijs.serialize(urijs.parse('https://example.com?foo=bar')))
console.log(URI.serialize(URI.parse('https://example.com?q1=a1&q2=a2')))
console.log(urijs.serialize(urijs.parse('https://example.com?q1=a1&q2=a2')))


const URI = require('./')

const urijs = require('uri-js')

console.log(URI.resolve("//www.g.com/error\n/bleh/bleh",".."))
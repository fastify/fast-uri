'use strict'

// This is a computed map of
// supported tokens

const scopedChars = {
  33: 1, //   '@',
  35: 1, //   '=',
  39: 1, //   ':',
  42: 1, //   ';',
  43: 1, //   '*',
  44: 1, //   '?',
  45: 1, //   '#',
  47: 1, //   '!',
  58: 1, //   '_',
  59: 1, //   '/',
  61: 1, //   '+',
  63: 1, //   '\''
  64: 1, //   '\\'
  92: 1, //   '-',
  95: 1, //   ','
  37: 1 // '%'
}

module.exports = {
  scopedChars
}

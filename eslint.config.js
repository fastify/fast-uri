'use strict'

module.exports = [
  ...require('neostandard')({
    ignores: require('neostandard').resolveIgnoresFromGitignore(),
    ts: true
  }),
  {
    files: ['index.js', 'lib/**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Literal[regex.pattern=/\\\\[pP]\\{/]',
        message: 'Unicode property escapes fail to compile on engines built without ICU (e.g. Node.js built --with-intl=none); use a character class.'
      }]
    }
  }
]

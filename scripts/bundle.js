'use strict'

const fs = require('fs')
const path = require('path')

function stripLeadingUseStrict(content) {
  return content.replace(/^['"]use strict['"]\s*/, '')
}

function stripRequireStatements(content) {
  return content.replace(/\/\* Require Start \*\/[\s\S]*?\/\* Require End \*\//g, '')
}

function stripModuleExports(content) {
  return content.replace(/\/\* Module Exports Start \*\/[\s\S]*?\/\* Module Exports End \*\//g, '')
}

const indexJs = [fs.readFileSync('./index.js', 'utf8')]
    .map(stripLeadingUseStrict)
    .map(stripRequireStatements)
    [0]

const libFileNames = fs.readdirSync(path.resolve(__dirname,'..', 'lib'))
  .map(file => path.resolve(__dirname, '..', 'lib', file))

const libFilesContent = libFileNames
    .map(file => fs.readFileSync(file, 'utf8'))
    .map(stripLeadingUseStrict)
    .map(stripRequireStatements)
    .map(stripModuleExports)
    .join('\n')

fs.writeFileSync(path.resolve(__dirname, '..', 'bundled.js'), "'use strict'\n" + libFilesContent + indexJs, 'utf8')



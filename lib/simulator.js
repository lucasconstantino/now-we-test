const http = require('http')
const micro = require('micro')
const supertest = require('supertest')
const invariant = require('invariant')

const simulators = {
  '@now/node': func => supertest(http.createServer(func)),
  'now-micro': func => supertest(micro(func))
}

module.exports.simulator = (func, builder = '@now/node') => {
  invariant(typeof func === 'function', 'Must be called with a function')
  invariant(simulators[builder], `Unsupported builder ${builder}`)

  return simulators[builder](func)
}

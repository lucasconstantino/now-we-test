const http = require('http')
const micro = require('micro')
const supertest = require('supertest')
const invariant = require('invariant')

const simulators = {
  /**
   * @node/node builder simulator.
   */
  '@now/node': func =>
    supertest(
      http.createServer((req, res) => {
        try {
          func(req, res)
        }
        catch (err) {
          res.statusCode = 502
          res.end(`
An error occurred with your deployment

NO_STATUS_CODE_FROM_LAMBDA
`)
        }
      })
    ),

  /**
   * now-micro builder simulator.
   */
  'now-micro': func => supertest(micro(func))
}

module.exports.simulator = (func, builder = '@now/node') => {
  invariant(typeof func === 'function', 'Must be called with a function')
  invariant(simulators[builder], `Unsupported builder ${builder}`)

  return simulators[builder](func)
}

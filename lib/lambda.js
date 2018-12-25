const micro = require('micro')
const supertest = require('supertest')
const invariant = require('invariant')

module.exports.lambda = (func) => {
  invariant(typeof func === 'function', 'Must be called with a function')

  // @TODO: improve context similarity between Now.sh lambdas and supertest instance.

  return supertest(micro(func))
}

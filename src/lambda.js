import micro from 'micro'
import supertest from 'supertest'
import invariant from 'invariant'

export const lambda = (func) => {
  invariant(typeof func === 'function', 'Must be called with a function')

  // @TODO: improve context similarity between Now.sh lambdas and supertest instance.

  return supertest(micro(func))
}

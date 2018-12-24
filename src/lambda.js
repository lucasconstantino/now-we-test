import micro from 'micro'
import supertest from 'supertest'
import invariant from 'invariant'

export const lambda = (func) => {
  invariant(typeof func === 'function', 'Must be called with a function')

  return supertest(micro(func))
}

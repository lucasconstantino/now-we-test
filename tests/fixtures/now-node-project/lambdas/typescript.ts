import * as jestMock from 'jest-mock'

export default jestMock.fn((req, res) => res.end('can run typescript lambdas'))

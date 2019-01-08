const jestMock = require('jest-mock')

module.exports = jestMock.fn(() => {
  throw new Error('Ooops!')
})

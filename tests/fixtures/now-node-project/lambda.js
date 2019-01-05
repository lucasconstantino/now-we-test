const jestMock = require('jest-mock')

module.exports = jestMock.fn((req, res) => {
  res.end('Hello world!')
})

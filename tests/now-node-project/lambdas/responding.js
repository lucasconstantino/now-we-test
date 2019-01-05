const jest = require('jest-mock')

module.exports = jest.fn((req, res) => {
  res.end('responding value')
})

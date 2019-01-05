const jest = require('jest-mock')

module.exports = jest.fn(() => {
  throw new Error('Ooops!')
})

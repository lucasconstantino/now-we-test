const jest = require('jest-mock')

module.exports = jest.fn(async () => 'async value')

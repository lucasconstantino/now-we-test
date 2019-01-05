const jestMock = require('jest-mock')

module.exports = jestMock.fn(async () => 'Hello world!')

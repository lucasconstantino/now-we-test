const jestMock = require('jest-mock')
const toPromise = require('stream-to-promise')

module.exports = jestMock.fn(async (req, res) => {
  const body = (await toPromise(req)).toString()
  const name = body ? JSON.parse(body).name : 'world'

  res.end(`Hello ${name}!`)
})

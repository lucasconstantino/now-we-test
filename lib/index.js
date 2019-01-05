const lambda = require('./lambda')
const simulator = require('./simulator')

module.exports = { ...lambda, ...simulator }

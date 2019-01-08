const path = require('path')
const http = require('http')
const micro = require('micro')
const supertest = require('supertest')
const invariant = require('invariant')
const staticHandler = require('serve-handler')

const lambdaSimulator = createApp => ({ entrypoint }) => async (req, res) => {
  const lambda =
    typeof entrypoint === 'string' ? require(entrypoint) : entrypoint

  invariant(typeof lambda === 'function', 'Lambdas must be functions')

  const method = req.method.toLowerCase()
  const app = createApp(lambda)
  const agent = supertest(app)

  // @TODO: should simulate more complex requests
  const response = await agent[method](req.url).set(req.headers)

  const { headers, text, statusCode } = response

  // @TODO: should simulate more complex responses

  // proxy headers
  Object.keys(headers).forEach(name => {
    res.setHeader(name, headers[name])
  })

  // proxy statusCode
  res.statusCode = statusCode

  // proxy text & end response
  res.end(text)
}

module.exports.simulators = {
  '@now/static': ({ entrypoint, rootPath, pathname }) => (req, res) => {
    // force static url path
    req.url = path.relative(process.cwd(), entrypoint)

    staticHandler(req, res, {
      cleanUrls: false
    })
  },

  /**
   * @node/node builder simulator.
   */
  '@now/node': lambdaSimulator(lambda =>
    http.createServer((req, res) => {
      try {
        lambda(req, res)
      }
      catch (err) {
        res.statusCode = 502
        res.end(`
An error occurred with your deployment

NO_STATUS_CODE_FROM_LAMBDA
`)
      }
    })
  ),

  /**
   * now-micro builder simulator.
   */
  'now-micro': lambdaSimulator(micro)
}

/**
 * Lambda simulator
 */
module.exports.simulator = (entrypoint, builder = '@now/node') => {
  invariant(
    module.exports.simulators[builder],
    `Unsupported builder ${builder}`
  )

  invariant(typeof entrypoint === 'function', 'Must be called with a function')

  return supertest(module.exports.simulators[builder]({ entrypoint }))
}

// retro-compatibility.
module.exports.lambda = module.exports.simulator

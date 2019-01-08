/* eslint-disable import/no-dynamic-require,global-require */
const { existsSync } = require('fs')
const path = require('path')
const { Command, flags } = require('@oclif/command')
const minimatch = require('minimatch')
const invariant = require('invariant')
const micro = require('micro')
const Regex = require('named-regexp-groups')
const morgan = require('morgan')
const clearModule = require('clear-module')
const { simulators, simulator } = require('../simulator')

const { createError } = micro

const supportedBuilders = Object.keys(simulators)

class ServeCommand extends Command {
  async run () {
    const {
      flags: { port, format },
      args: { path: basePath }
    } = this.parse(ServeCommand)
    // const name = flags.name || 'world'

    const rootPath = path.resolve(process.cwd(), basePath)
    const nowConfigPath = path.resolve(rootPath, 'now.json')
    invariant(
      existsSync(nowConfigPath),
      `No now.json found at ${nowConfigPath}`
    )

    this.debug(`using ${nowConfigPath}`)

    const { builds = [], routes = [] } = require(nowConfigPath)

    // find all supported lambdas
    const supportedBuilds = builds.filter(
      ({ use }) => supportedBuilders.indexOf(use) > -1
    )

    invariant(supportedBuilds.length > 0, 'No supported lambdas found')

    const httpLogger = morgan(format)

    const app = micro(async (req, res, ...args) => {
      const urls = [req.url]

      if (routes.length) {
        const route = routes.find(
          ({ src, methods }) =>
            (!methods || methods.indexOf(req.method) !== -1) &&
            req.url.match(new RegExp(`^${src.replace(/\(\?<[a-z]+>/, '(')}$`))
        )

        if (route) {
          const captGroups = []

          // see https://stackoverflow.com/a/11443943
          route.src.replace(/\(\?<([a-z]+)>/gi, (match, id) => {
            captGroups.push(id)
          })

          // @TODO: should normalize dest to PCRE complient backreferences
          // see: http://perldoc.perl.org/perlretut.html#Named-backreferences
          urls.push(
            req.url.replace(
              new Regex(route.src),
              captGroups.reduce(
                (dest, id) => dest.replace(new RegExp('\\$' + id), `$+{${id}}`),
                route.dest
              )
            )
          )
        }
      }

      const pathname = urls
        .map(url =>
          `${url.replace(/^\//, '').replace(/\?.*/, '')}.js`.replace(
            '.js.js',
            '.js'
          )
        )
        .find((value, i) =>
          supportedBuilds.find(({ src }) => minimatch(value, src))
        )

      if (!pathname) {
        throw createError(404, 'No lambda matching requested path')
      }

      const targetPath = path.resolve(rootPath, pathname)
      const builder = supportedBuilds.find(({ src }) =>
        minimatch(pathname, src)
      )

      // Handle not-found paths.
      if (!existsSync(targetPath)) {
        throw createError(404, 'Expected lambda file not found')
      }

      // ensure every module state and context is cleaned-up between requests.
      clearModule.match(/.*/)

      httpLogger(req, res, async err => {
        if (err) throw err

        const lambda = require(targetPath)
        invariant(typeof lambda === 'function', 'Lambdas must be functions')

        const simulate = simulator(require(targetPath), builder.use)

        // @TODO: should simulate more complex requests
        const response = await simulate[req.method.toLowerCase()](req.url).set(
          req.headers
        )

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
      })
    })

    app.listen(port, () =>
      this.log(`Serving lambdas at http://localhost:${port}`)
    )

    // save it to make it possible to bring it down.
    return app
  }
}

// ServeCommand.description = `Serves the lambdas locally
// ...
// Extra documentation goes here
// `

ServeCommand.description = 'Serves the lambdas locally'

ServeCommand.args = [
  {
    name: 'path',
    required: false,
    description: 'The path to the directory where now.json stands',
    default: '.'
  }
]

ServeCommand.flags = {
  port: flags.string({
    char: 'p',
    description: 'port to use',
    default: 3000,
    env: 'PORT'
  }),
  format: flags.string({
    char: 'f',
    description: 'logger format (morgan compliant)',
    default: 'combined'
  })
}

module.exports = ServeCommand

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
const { simulators } = require('../simulator')

const { createError } = micro

const builders = Object.keys(simulators)

// FIXME: Supporting canary version of node builders until Typescript will make it to the stable release (https://github.com/zeit/now-builders/issues/46)
builders.push('@now/node@canary')

class ServeCommand extends Command {
  async run () {
    const {
      flags: { port, format, timeout },
      args: { path: basePath }
    } = this.parse(ServeCommand)
    // const name = flags.name || 'world'

    const rootPath = path.resolve(process.cwd(), basePath)
    const configPath = path.resolve(rootPath, 'now.json')

    invariant(existsSync(configPath), `No now.json found at ${configPath}`)

    this.debug(`using ${configPath}`)

    const { builds = [], routes = [] } = require(configPath)

    // find all supported builders
    const supportedBuilds = builds.filter(
      ({ use }) => builders.indexOf(use) > -1
    )

    invariant(supportedBuilds.length > 0, 'No supported builds found')

    // preconfigure formatter
    const httpLogger = morgan(format)

    const app = micro(async (req, res, ...args) => {
      const paths = [req.url]

      if (routes.length) {
        const route = routes.find(
          ({ src, methods }) =>
            (!methods || methods.indexOf(req.method) !== -1) &&
            req.url.match(new RegExp(`^${src.replace(/\(\?<[a-z]+>/, '(')}$`))
        )

        // compatible route found
        if (route) {
          const captGroups = []

          // see https://stackoverflow.com/a/11443943
          route.src.replace(/\(\?<([a-z]+)>/gi, (match, id) => {
            captGroups.push(id)
          })

          // register route destination
          // @TODO: should normalize dest to PCRE complient backreferences
          // see: http://perldoc.perl.org/perlretut.html#Named-backreferences
          paths.push(
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

      const pathname = paths
        // remove trailing slash
        .map(url => url.replace(/^\//, ''))
        // remove query params
        .map(url => url.replace(/\?.*/, ''))
        // remove potential duplicated extension (i.e. .js.js or .ts.ts)
        .map(url => url.replace(/(\.[tj]s)\1$/, '$1'))

        // find the first build registered url
        .find(url => supportedBuilds.find(({ src }) => minimatch(url, src)))

      if (!pathname) {
        throw createError(404, 'No input matching requested path')
      }

      // find the compatible builder
      const builder = supportedBuilds.find(({ src }) =>
        minimatch(pathname, src)
      )

      // FIXME: remove once @now/node stable will support Typescript
      // removing unnecessary canary tag to match simulator key
      builder.use = builder.use.replace('@canary', '')

      invariant(builder, `No builder found for path ${pathname}`)

      const targetPath = path.resolve(rootPath, pathname)

      // handle not-found paths.
      if (!existsSync(targetPath)) {
        throw createError(404, `Expected input not found for path ${pathname}`)
      }

      // ensure every module state and context is cleaned-up between requests.
      clearModule.match(/.*/)

      httpLogger(req, res, err => {
        if (err) throw err

        const context = {
          entrypoint: targetPath,
          pathname: `/${pathname}`,
          rootPath,
          builder,
          server: app,
          timeout
        }

        simulators[builder.use](context)(req, res)
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
  }),
  timeout: flags.string({
    char: 't',
    description: 'general request timeout',
    default: null
  })
}

module.exports = ServeCommand

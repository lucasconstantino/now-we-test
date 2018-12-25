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

const { createError } = micro

class ServeCommand extends Command {
  async run () {
    const {
      flags: { port, format },
      args: { path: basePath }
    } = this.parse(ServeCommand)
    // const name = flags.name || 'world'

    const rootPath = path.resolve(process.cwd(), basePath)
    const projectPaths = new Regex(`${rootPath}/.*`)
    const nowConfigPath = path.resolve(rootPath, 'now.json')
    invariant(
      existsSync(nowConfigPath),
      `No now.json found at ${nowConfigPath}`
    )

    this.debug(`using ${nowConfigPath}`)

    const { builds = [], routes = [] } = require(nowConfigPath)

    // find all node lambdas
    const nodeBuilds = builds.filter(({ use }) => use === '@now/node')
    invariant(nodeBuilds.length > 0, 'No @now/node builds found')

    const httpLogger = morgan(format)

    const app = micro((req, res, ...args) => {
      const urls = [req.url]

      if (routes.length) {
        const route = routes.find(({ src }) =>
          req.url.match(src.replace(/\(\?<[a-z]+>/, '('))
        )

        if (route) {
          // @TODO: should normalize dest to PCRE complient backreferences
          // see: http://perldoc.perl.org/perlretut.html#Named-backreferences
          urls.push(req.url.replace(new Regex(route.src), route.dest))
        }
      }

      const pathname = urls
        .map(url =>
          `${url.replace(/^\//, '').replace(/\?.*/, '')}.js`.replace(
            '.js.js',
            '.js'
          )
        )
        .find((value, i) => nodeBuilds.find(({ src }) => minimatch(value, src)))

      if (!pathname) {
        throw createError(404, 'No lambda matching requested path')
      }

      const targetPath = path.resolve(rootPath, pathname)

      // Handle not-found paths.
      if (!existsSync(targetPath)) {
        throw createError(404, 'Expected lambda file not found')
      }

      clearModule.match(projectPaths)
      const lambda = require(targetPath)
      invariant(typeof lambda === 'function', 'Lambdas must be functions')

      return new Promise(resolve => {
        httpLogger(req, res, err => {
          if (err) throw err

          resolve(lambda(req, res, ...args))
        })
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

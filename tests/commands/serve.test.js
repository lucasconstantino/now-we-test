/* eslint-disable global-require */
const net = require('net')
const path = require('path')
const supertest = require('supertest')
const console = require('console-suppress').default
const ServeCommand = require('now-we-test/commands/serve')

const lambdas = {
  unrouted: require('../sample-project/lambda.js'),
  simple: require('../sample-project/lambdas/simple'),
  async: require('../sample-project/lambdas/async'),
  responding: require('../sample-project/lambdas/responding')
}

const basePath = path.resolve(__dirname, '../sample-project')

const isPortAvailable = port =>
  new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', err =>
        err.code === 'EADDRINUSE' ? resolve(false) : reject(err)
      )
      .once('listening', () =>
        tester.once('close', () => resolve(true)).close()
      )
      .listen(port)
  })

describe('commands', () => {
  describe('serve', () => {
    let app

    beforeEach(() => {
      jest.clearAllMocks()
      console.cleanSuppressors()
    })

    afterEach(done => (app ? app.close(done) : done()))

    it('should have a run method', () => {
      expect(ServeCommand.run).toBeInstanceOf(Function)
    })

    it('should throw when no now.json is found', async () => {
      await expect(ServeCommand.run([])).rejects.toThrow(/No now\.json found/)
    })

    it('should start serving when working now.json found', async () => {
      app = await ServeCommand.run([basePath])

      expect(app.listening).toBe(true)
    })

    it('should listen on specific port when configured', async () => {
      await expect(isPortAvailable(3001)).resolves.toBe(true)
      app = await ServeCommand.run([basePath, '--port=3001'])
      await expect(isPortAvailable(3001)).resolves.toBe(false)
    })

    it('should return 404 when no lambda found on the requested URL', async () => {
      console.error.suppress(/No lambda matching requested path/)

      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/non/existing/path')
        .expect(404, 'No lambda matching requested path')
    })

    it('should run a simple value returning lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/simple')
        .expect(200, 'simple value')

      expect(lambdas.simple).toHaveBeenCalledTimes(1)
    })

    it('should run an async value returning lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/async')
        .expect(200, 'async value')

      expect(lambdas.async).toHaveBeenCalledTimes(1)
    })

    it('should run an response dispatching lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/responding')
        .expect(200, 'responding value')

      expect(lambdas.responding).toHaveBeenCalledTimes(1)
    })

    it('should run on unrouted (direct path) lambdas', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/lambda')
        .expect(200, 'result')

      expect(lambdas.unrouted).toHaveBeenCalledTimes(1)
    })

    it('should respect provided methods', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom-path')
        .expect(200, 'simple value')

      expect(lambdas.simple).toHaveBeenCalledTimes(1)

      console.error.suppress(/No lambda matching requested path/)

      await supertest(app)
        .post('/custom-path')
        .expect(404, 'No lambda matching requested path')

      expect(lambdas.simple).toHaveBeenCalledTimes(1)
    })
  })
})

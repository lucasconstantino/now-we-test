/* eslint-disable global-require */
const net = require('net')
const path = require('path')
const supertest = require('supertest')
const console = require('console-suppress').default
const ServeCommand = require('now-we-test/commands/serve')

const lambdas = {
  unrouted: require('../fixtures/now-node-project/lambda.js'),
  returning: require('../fixtures/now-node-project/lambdas/returning'),
  asyncReturning: require('../fixtures/now-node-project/lambdas/asyncReturning'),
  responding: require('../fixtures/now-node-project/lambdas/responding')
}

const basePath = path.resolve(__dirname, '../fixtures/now-node-project')

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
      Object.keys(lambdas).forEach(name => {
        lambdas[name].mockClear()
      })

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

    it('should run a value returning lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/returning')
        .expect(200, 'Hello world!')

      expect(lambdas.returning).toHaveBeenCalledTimes(1)
    })

    it('should run an async value returning lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/asyncReturning')
        .expect(200, 'Hello world!')

      expect(lambdas.asyncReturning).toHaveBeenCalledTimes(1)
    })

    it('should run an response dispatching lambda', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/custom/path/responding')
        .expect(200, 'Hello world!')

      expect(lambdas.responding).toHaveBeenCalledTimes(1)
    })

    it('should run on unrouted (direct path) lambdas', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/lambda')
        .expect(200, 'Hello world!')

      expect(lambdas.unrouted).toHaveBeenCalledTimes(1)
    })

    it('should respect provided methods', async () => {
      app = await ServeCommand.run([basePath])

      await supertest(app)
        .get('/method-path')
        .expect(200, 'Hello world!')

      expect(lambdas.returning).toHaveBeenCalledTimes(1)

      console.error.suppress(/No lambda matching requested path/)

      await supertest(app)
        .post('/method-path')
        .expect(404, 'No lambda matching requested path')

      expect(lambdas.returning).toHaveBeenCalledTimes(1)
    })
  })
})

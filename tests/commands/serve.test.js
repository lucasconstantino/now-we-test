/* eslint-disable global-require */
const net = require('net')
const path = require('path')
const supertest = require('supertest')
const console = require('console-suppress').default
const ServeCommand = require('now-we-test/commands/serve')

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
  beforeEach(() => console.cleanSuppressors())

  describe('serve', () => {
    describe('@now/node', () => {
      let app

      const basePath = path.resolve(__dirname, '../fixtures/now-node-project')

      const lambdas = {
        unrouted: require('../fixtures/now-node-project/lambda.js'),
        returning: require('../fixtures/now-node-project/lambdas/returning'),
        asyncReturning: require('../fixtures/now-node-project/lambdas/asyncReturning'),
        responding: require('../fixtures/now-node-project/lambdas/responding'),
        throwing: require('../fixtures/now-node-project/lambdas/throwing')
      }

      beforeEach(() => {
        Object.keys(lambdas).forEach(name => {
          lambdas[name].mockClear()
        })
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

      describe('returning', () => {
        it('should timeout on a value returning lambda', async () => {
          app = await ServeCommand.run([basePath])

          await expect(
            supertest(app)
              .get('/custom/path/returning')
              .timeout(100)
          ).rejects.toThrow(/Timeout of 100ms exceeded/)

          expect(lambdas.returning).toHaveBeenCalledTimes(1)
        })
      })

      describe('async', () => {
        it('should timeout on an async value returning lambda', async () => {
          app = await ServeCommand.run([basePath])

          await expect(
            supertest(app)
              .get('/custom/path/asyncReturning')
              .timeout(100)
          ).rejects.toThrow(/Timeout of 100ms exceeded/)

          expect(lambdas.asyncReturning).toHaveBeenCalledTimes(1)
        })
      })

      describe('responding', () => {
        it('should run an response dispatching lambda', async () => {
          app = await ServeCommand.run([basePath])

          await supertest(app)
            .get('/custom/path/responding')
            .expect(200, 'Hello world!')

          expect(lambdas.responding).toHaveBeenCalledTimes(1)
        })
      })

      describe('throwing', () => {
        it('should run a throwing lambda', async () => {
          app = await ServeCommand.run([basePath])

          await supertest(app)
            .get('/custom/path/throwing')
            .expect(502, /NO_STATUS_CODE_FROM_LAMBDA/)

          expect(lambdas.throwing).toHaveBeenCalledTimes(1)
        })
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

        expect(lambdas.unrouted).toHaveBeenCalledTimes(1)

        console.error.suppress(/No lambda matching requested path/)

        await supertest(app)
          .post('/method-path')
          .expect(404, 'No lambda matching requested path')

        expect(lambdas.unrouted).toHaveBeenCalledTimes(1)
      })
    })
  })
})

const { simulator } = require('now-we-test')

describe('simulator', () => {
  const lambdas = {
    returning: jest.fn(() => 'Hello world!'),
    async: jest.fn(async () => 'Hello world!'),
    responding: jest.fn((req, res) => {
      res.end('Hello world!')
    })
  }

  beforeEach(() => jest.clearAllMocks())

  describe('constructor', () => {
    it('should be a function', () => {
      expect(() => simulator()).toBeInstanceOf(Function)
    })

    it('should throw when not invoked with a Function', () => {
      expect(() => simulator()).toThrow('Must be called with a function')
    })

    it('should return a supertest instance', () => {
      const app = simulator(() => {})

      expect(app).toHaveProperty('get')
      expect(app).toHaveProperty('post')
      expect(app).toHaveProperty('put')
      expect(app).toHaveProperty('delete')
    })

    it('should throw when invoked with unknown builder', () => {
      expect(() => simulator(() => {}, 'unknown-builders')).toThrow(
        'Unsupported builder unknown-builders'
      )
    })
  })

  describe('@now/node', () => {
    describe('returning', () => {
      it('should timeout on a value returning lambda', async () => {
        await expect(
          simulator(lambdas.returning, '@now/node')
            .get('/')
            .timeout(10)
        ).rejects.toThrow(/Timeout of 10ms exceeded/)

        expect(lambdas.returning).toHaveBeenCalledTimes(1)
      })
    })

    describe('async', () => {
      it('should run an async value returning lambda', async () => {
        await expect(
          simulator(lambdas.async, '@now/node')
            .get('/')
            .timeout(10)
        ).rejects.toThrow(/Timeout of 10ms exceeded/)

        expect(lambdas.async).toHaveBeenCalledTimes(1)
      })
    })

    describe('responding', () => {
      it('should run an response dispatching lambda', async () => {
        const app = simulator(lambdas.responding, '@now/node')
        const result = await app.get('/').timeout(10)

        expect(lambdas.responding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })
  })

  describe('now-micro', () => {
    describe('returning', () => {
      it('should run a value returning lambda', async () => {
        const app = simulator(lambdas.returning, 'now-micro')
        const result = await app.get('/')

        expect(lambdas.returning).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('async', () => {
      it('should run an async value returning lambda', async () => {
        const app = simulator(lambdas.async, 'now-micro')
        const result = await app.get('/')

        expect(lambdas.async).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('responding', () => {
      it('should run an response dispatching lambda', async () => {
        const app = simulator(lambdas.responding, 'now-micro')
        const result = await app.get('/')

        expect(lambdas.responding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })
  })
})

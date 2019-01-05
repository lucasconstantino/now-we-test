const console = require('console-suppress').default
const { simulator } = require('now-we-test')

const lambdas = {
  returning: jest.fn(() => 'Hello world!'),
  responding: jest.fn((req, res) => {
    res.end('Hello world!')
  }),

  asyncReturning: jest.fn(async () => 'Hello world!'),
  asyncResponding: jest.fn(async (req, res) => {
    res.end('Hello world!')
  }),

  throwing: jest.fn(() => {
    throw new Error('Ooops!')
  })
}

describe('simulator', () => {
  beforeEach(() => jest.clearAllMocks())
  beforeEach(() => console.cleanSuppressors())

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
            .timeout(100)
        ).rejects.toThrow(/Timeout of 100ms exceeded/)

        expect(lambdas.returning).toHaveBeenCalledTimes(1)
      })
    })

    describe('responding', () => {
      it('should run an response dispatching lambda', async () => {
        const app = simulator(lambdas.responding, '@now/node')
        const result = await app.get('/').timeout(100)

        expect(lambdas.responding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('async', () => {
      it('should timeout an async value returning lambda', async () => {
        await expect(
          simulator(lambdas.asyncReturning, '@now/node')
            .get('/')
            .timeout(100)
        ).rejects.toThrow(/Timeout of 100ms exceeded/)

        expect(lambdas.asyncReturning).toHaveBeenCalledTimes(1)
      })

      it('should run an async response dispatching lambda', async () => {
        const app = simulator(lambdas.asyncResponding, '@now/node')
        const result = await app.get('/').timeout(100)

        expect(lambdas.asyncResponding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('throwing', () => {
      it('should return 502 on a throwing lambda', async () => {
        const app = simulator(lambdas.throwing, '@now/node')
        const result = await app.get('/').timeout(100)

        expect(lambdas.throwing).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 502)
        expect(result.text).toMatch(/NO_STATUS_CODE_FROM_LAMBDA/)
      })
    })
  })

  describe('now-micro', () => {
    describe('returning', () => {
      it('should timeout on a value returning lambda', async () => {
        const app = simulator(lambdas.returning, 'now-micro')
        const result = await app.get('/').timeout(100)

        expect(lambdas.returning).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('responding', () => {
      it('should run an response dispatching lambda', async () => {
        const app = simulator(lambdas.responding, 'now-micro')
        const result = await app.get('/').timeout(100)

        expect(lambdas.responding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('async', () => {
      it('should timeout an async value returning lambda', async () => {
        const app = simulator(lambdas.asyncReturning, 'now-micro')
        const result = await app.get('/').timeout(100)

        expect(lambdas.asyncReturning).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })

      it('should run an async response dispatching lambda', async () => {
        const app = simulator(lambdas.asyncResponding, 'now-micro')
        const result = await app.get('/').timeout(100)

        expect(lambdas.asyncResponding).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 200)
        expect(result).toHaveProperty('text', 'Hello world!')
      })
    })

    describe('throwing', () => {
      it('should return 502 on a throwing lambda', async () => {
        console.error.suppress('Ooops!')

        const app = simulator(lambdas.throwing, 'now-micro')
        const result = await app.get('/').timeout(100)

        expect(lambdas.throwing).toHaveBeenCalledTimes(1)
        expect(result).toHaveProperty('status', 500)
        expect(result).toHaveProperty('text', 'Internal Server Error')
      })
    })
  })
})

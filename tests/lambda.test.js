const { lambda } = require('now-we-test')

describe('lambda', () => {
  const lambdas = {
    simple: jest.fn(() => 'Hello world!'),
    async: jest.fn(async () => 'Hello world!'),
    responding: jest.fn((req, res) => res.end('Hello world!')),
  }

  beforeEach(() => jest.clearAllMocks())

  describe('constructor', () => {
    it('should be a function', () => {
      expect(lambda).toBeInstanceOf(Function)
    })

    it('should throw when not invoked with a Function', () => {
      expect(() => {
        lambda()
      }).toThrow('Must be called with a function')
    })

    it('should return a supertest instance', () => {
      const app = lambda(() => {})

      expect(app).toHaveProperty('get')
      expect(app).toHaveProperty('post')
      expect(app).toHaveProperty('put')
      expect(app).toHaveProperty('delete')
    })
  })

  describe('simple', () => {
    it('should run a simple value returning lambda', async () => {
      const app = lambda(lambdas.simple)
      const result = await app.get('/')

      expect(lambdas.simple).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('status', 200)
      expect(result).toHaveProperty('text', 'Hello world!')
    })
  })

  describe('async', () => {
    it('should run an async value returning lambda', async () => {
      const app = lambda(lambdas.async)
      const result = await app.get('/')

      expect(lambdas.async).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('status', 200)
      expect(result).toHaveProperty('text', 'Hello world!')
    })
  })

  describe('responding', () => {
    it('should run an response dispatching lambda', async () => {
      const app = lambda(lambdas.async)
      const result = await app.get('/')

      expect(lambdas.async).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('status', 200)
      expect(result).toHaveProperty('text', 'Hello world!')
    })
  })
})

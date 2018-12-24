import { lambda } from 'now-we-test'

describe('lambda', () => {
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

  describe('invoke', () => {
    it('should run a simple value returning lambda', async () => {
      const func = jest.fn(() => 'result')
      const app = lambda(func)

      const result = await app.get('/')

      expect(func).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('status', 200)
      expect(result).toHaveProperty('text', 'result')
    })
  })
})

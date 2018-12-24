# Now we Test

[![Build Status](https://travis-ci.org/lucasconstantino/now-we-test.svg?branch=master)](https://travis-ci.org/lucasconstantino/now-we-test)
[![coverage](https://img.shields.io/codecov/c/github/lucasconstantino/now-we-test.svg?style=flat-square)](https://codecov.io/github/lucasconstantino/now-we-test)
[![npm version](https://img.shields.io/npm/v/now-we-test.svg?style=flat-square)](https://www.npmjs.com/package/now-we-test)

Temporary lib to help test [Now.sh](https://zeit.co/now) lambdas written in Node.js. It was created with the purpose to eventually be deprecated when [`now dev` command](https://github.com/zeit/now-cli/issues/1681) is released.

## Purpose

Help unit test and locally serve lambdas written to deploy using Now.

## Installation

`yarn add now-we-test --dev`

## Usage

### Unit tests

In your unit tests, you can use the `lambda` help to simulate a lambda execution environment without needing a running server:

```js
import { lambda } from 'now-we-test'
import func from '../your-lambda-implementation'

const app = lambda(func)

describe('func', () => {
  it('should do something', async () => {
    const result = await app.get('/')

    expect(result.text).toBe('[the value returned by the lambda]')
  })
})
```

> The result of the invokation of `lambda` helper is a [SuperTest](https://github.com/visionmedia/supertest) instance, so please refer to that documentation for details on possible assertions and usage.

# Now we test

[![Build Status](https://travis-ci.org/lucasconstantino/now-we-test.svg?branch=master)](https://travis-ci.org/lucasconstantino/now-we-test)
[![coverage](https://img.shields.io/codecov/c/github/lucasconstantino/now-we-test.svg?style=flat-square)](https://codecov.io/github/lucasconstantino/now-we-test)
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![npm version](https://img.shields.io/npm/v/now-we-test.svg?style=flat-square)](https://www.npmjs.com/package/now-we-test)

Temporary lib to help test [Now.sh](https://zeit.co/now) lambdas written in Node.js. It was created with the purpose to eventually be deprecated when [`now dev` command](https://github.com/zeit/now-cli/issues/1681) is released.

## Purpose

Help unit test and locally serve lambdas written to deploy using Now.

## Installation

`yarn add now-we-test --dev`

## Usage

### For unit tests

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

### For locally serving lambdas

_Now we test_ provides a simple CLI to serve your lambdas locally - useful for testing integration with other tools.

> Keep in mind there is only so much it can do in terms of simulation, so you should never completelly trust what works locally would necessarily work on Now.sh environment.

#### Commands

- [`now-we-test serve`](#now-we-test-serve)
- [`now-we-test help [COMMAND]`](#now-we-test-help-command)

##### `now-we-test serve`

Serves the lambdas locally

```
USAGE
  $ now-we-test serve [PATH]

ARGUMENTS
  PATH  [default: .] The path to the directory where now.json stands

OPTIONS
  -f, --format=format  [default: combined] logger format (morgan compliant)
  -p, --port=port      [default: 3000] port to use
```

_See code: [src/commands/serve.js](https://github.com/lucasconstantino/now-we-test/blob/v0.0.0/src/commands/serve.js)_

##### `now-we-test help [COMMAND]`

display help for a now-we-test command

```
USAGE
  $ now-we-test help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```


##### `now-we-test-ts [COMMAND]`

For Typescript users, you can test your lamdas locally with this command.\
Keep in mind that you will need `ts-node` and `typescript` to be installed in your project for this
to work properly.\
You will also need to specify the `.ts` extension when requesting Typescript lambdas, either manually
or by using now.json routes.
i.e.

```json
  {
    "src": "/api/(.*)",
    "dest": "/api/$1.ts"
  },
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_

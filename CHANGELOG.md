# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.5.0"></a>
# [0.5.0](https://github.com/lucasconstantino/now-we-test/compare/v0.4.0...v0.5.0) (2019-01-05)


`serve` command now behaves more similarly to the Now 2.0 @now/node environment, but provides full Micro environment using the [now-micro builder](https://github.com/lucasconstantino/now-micro).

### Bug Fixes

* lint warnings ([9feef0d](https://github.com/lucasconstantino/now-we-test/commit/9feef0d))


### Features

* added simulator help to replace "lambda" but with multiple builders compatibility ([babe13a](https://github.com/lucasconstantino/now-we-test/commit/babe13a))
* augmented cache cleanup to basically include everything (total refresh) ([923976d](https://github.com/lucasconstantino/now-we-test/commit/923976d))
* simulated [@now](https://github.com/now)/node thrown error handling ([f24cbb6](https://github.com/lucasconstantino/now-we-test/commit/f24cbb6))
* updated serve command to use simulators ([2a1dbbc](https://github.com/lucasconstantino/now-we-test/commit/2a1dbbc))

### Deprecated

* lambda function is deprecated and will be removed soon



<a name="0.4.0"></a>
# 0.4.0 (2018-12-31)


### Bug Fixes

* fixed node < 7 ([3a36cd2](https://github.com/lucasconstantino/now-we-test/commit/3a36cd2))
* fixed route matching for node < 10 ([928cff8](https://github.com/lucasconstantino/now-we-test/commit/928cff8))
* fixed serving matching urls to be strict, not loose ([ca4dfb3](https://github.com/lucasconstantino/now-we-test/commit/ca4dfb3))
* use same regex capturing group syntax as now.sh expects ([e6a85ba](https://github.com/lucasconstantino/now-we-test/commit/e6a85ba))


### Features

* added lambda helper implementaiton and tests ([4520bc1](https://github.com/lucasconstantino/now-we-test/commit/4520bc1))
* implemented lambda serving command ([eb1cb9a](https://github.com/lucasconstantino/now-we-test/commit/eb1cb9a))
* updated serve command to respect methods ([606f03c](https://github.com/lucasconstantino/now-we-test/commit/606f03c))
* updated serve command to return http server for tests and outer control ([07736c3](https://github.com/lucasconstantino/now-we-test/commit/07736c3))

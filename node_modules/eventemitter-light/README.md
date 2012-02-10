# eventemitter-light [![Build Status][1]][2]

Tiny event emitter for node and the browser

## Status: Beta

## Example

```javascript
var EventEmitter = require("eventemitter-light");

var ee = Object.create(EventEmitter).constructor();

ee.on('foo.namespaces', logFoo);
ee.emit('foo.namespaces');

function logFoo() {
	console.log('foo');
}
```

## Motivation

EventEmitter2 is 2kb. That's far too much. EE-light is a sensible 250bytes

## Documentation

It's like EventEmitter build into node.

```javascript
ee.on("foo", works)

ee.emit('foo');
// works

function works() { console.log('works'); }
```

### Supported methods

 - on
 - emit
 - removeListener
 - once

## Installation

`npm install eventemitter-light`

## Test

`make test`

## Contributors

 - Raynos

## MIT Licenced

 [1]: https://secure.travis-ci.org/Raynos/eventemitter-light.png
 [2]: http://travis-ci.org/Raynos/eventemitter-light
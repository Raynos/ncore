# nCore [![Build Status][1]][2]

A Core library for your node application infrastructure.

## Status: Rewrite in progress

 - [example][14]
 - [motivation][15]
 - [docs][16]
 - [Installation][17]
 - [test][18]
 - [contributors][19]
 - [licence][20]

## Example <a name="example" href="#example"><small><sup>link</sup></small></a>

``` javascript
var Core = Object.create(require("nCore")).constructor({
        server: {
            controller: "hello-world"
        }
    }),
    http = require("http");

Core.use("hello-world", {
    define: function (interface) {
        interface.print = function (req, res) {
            res.end("hello world");
        };
    }
})

Core.use("server", {
    inject: function (deps) {
        http.createServer(function (req, res) {
            deps.controller.print(req, res);
        }).listen(8080);
    }
});

Core.init();
```

## Motivation <a name="motivation" href="#motivation"><small><sup>link</sup></small></a>

nCore is a dependency injection framework.

 - It strictly defines what a unit is and makes it easy to mock out that unit's dependencies. This makes testing and TDD easy
 - It injects dependencies into your modules based on a file based configuration system and allows you to define the public interface of a module either using methods or using event emitters. This allows for loose coupling and encapsulation.
 - It has support for hot reloading of modules. This basically means removing and adding modules on the fly whilst your core is still running

## Documentation <a name="docs" href="#docs"><small><sup>link</sup></small></a>

 - [nCore 0.x documentation][3]    
 - [Module format][10]
    - [define][11]
    - [inject][12]
    - [expose][13]
 - [Core][21]
    - [Core.interfaces][9]
    - [Core.constructor][8]
    - [Core.use][4]
    - [Core.init][5]
    - [Core.remove][6]
    - [Core.purge][7]

## Module format <a name="module" href="#module"><small><sup>link</sup></small></a>

A module has a few public properties that are used by the Core.

A module defines it's own public interface through [`define`][11] and accepts it's dependencies through [`inject`][12]. Alternatively a module can define it's dependencies through [`expose`][13] and alternatively if the module has no [`inject`][12] method the dependencies are mixed into the module

### `define(interface)` <a name="define" href="#define"><small><sup>link</sup></small></a>

A module is the implementation of an interface. When other modules want to interact with it, they should interact through a public interface. The way to define the public interface of a module is by defining an interface

``` javascript
var Core = Object.create(require("ncore")).constructor()
```

## `Core` <a name="core" href="#core"><small><sup>link</sup></small></a>

The Core is an object you attach modules to. It keeps a record of the dependency mapping between modules and initializes multiple modules with their correct dependencies.

### `Core.constructor(deps, [ee])` <a name="constructor" href="#constructor"><small><sup>link</sup></small></a>

Instantiate an instance of the core. You need to pass the dependency mapping to the core so it knows what to inject into what module. You can also optionally pass in EventEmitter prototype which will be mixed into every interface.

``` javascript
var ncore = require("ncore");

// create an instance
var Core = Object.create(ncore).constructor();

Core.use(...);
```

``` javascript
var ncore = require("ncore"),
    assert = require("assert");

var Core = Object.create(ncore).constructor({
    // The dependencies for foo are
    foo: {
        // an object called bar that contains the interface baz
        bar: "baz"
    }
});

Core.use("baz", bazObject);

Core.use("foo", {
    inject: function (deps) {
        // For module foo the deps object contains a bar property
        // that is bazObject
        assert.equal(deps.bar, bazObject);
    }
});
```

``` javascript
var ncore = require("ncore"),
    EventEmitter = require("eventemitter2").EventEmitter.prototype;

var Core = Object.create(ncore).constructor(null, EventEmitter);

Core.use("bar", {});

// The bar interface is now an EventEmitter2 instance
assert(Core.interfaces.bar.many)
```

### `Core.interfaces` <a name="interfaces" href="#interfaces"><small><sup>link</sup></small></a>

The Core has a public property named interfaces that contains all the public interfaces attached to the core.

A public interface is a proxy of the internal interface (the one passed to define) which means it has all the same properties / methods, it just has a thin proxy that invokes them indirectly. This proxy exist for easy module hot reloading.

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert");

Core.use("name", {
    define: function (interface) {
        interface.method = function () { }
    }
})

assert(Core.interfaces.name.method);
```

/* TODO */

## Installation <a name="install" href="#install"><small><sup>link</sup></small></a>

`$ npm install ncore`

## Test <a name="test" href="#test"><small><sup>link</sup></small></a>

`$ make test`

## contributors <a name="contributors" href="#contributors"><small><sup>link</sup></small></a>

 - Raynos

## MIT Licenced <a name="licence" href="#licence"><small><sup>link</sup></small></a>

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/Raynos/ncore/tree/0.x
  [4]: https://github.com/Raynos/ncore#use
  [5]: https://github.com/Raynos/ncore#init
  [6]: https://github.com/Raynos/ncore#remove
  [7]: https://github.com/Raynos/ncore#purge
  [8]: https://github.com/Raynos/ncore#constructor
  [9]: https://github.com/Raynos/ncore#interfaces
  [10]: https://github.com/Raynos/ncore#module
  [11]: https://github.com/Raynos/ncore#define
  [12]: https://github.com/Raynos/ncore#inject
  [13]: https://github.com/Raynos/ncore#expose
  [14]: https://github.com/Raynos/ncore#example
  [15]: https://github.com/Raynos/ncore#motivation
  [16]: https://github.com/Raynos/ncore#docs
  [17]: https://github.com/Raynos/ncore#install
  [18]: https://github.com/Raynos/ncore#test
  [19]: https://github.com/Raynos/ncore#contributors
  [20]: https://github.com/Raynos/ncore#licence
  [21]: https://github.com/Raynos/ncore#core
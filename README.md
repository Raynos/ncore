# nCore [![Build Status][1]][2]

A Core library for your node application infrastructure. Handles initialization, bootstrapping and dependency injection for you.

## Status: Rewrite in progress

 - [example][14]
 - [motivation][15]
 - [docs][16]
 - [Installation][17]
 - [test][18]
 - [contributors][19]
 - [licence][20]

## <a name="example" href="#example">Example <small><sup>link</sup></small></a>

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

## <a name="motivation" href="#motivation">Motivation <small><sup>link</sup></small></a>

nCore is a dependency injection framework.

 - It strictly defines what a unit is and makes it easy to mock out that unit's dependencies. This makes testing and TDD easy
 - It injects dependencies into your modules based on a file based configuration system and allows you to define the public interface of a module either using methods or using event emitters. This allows for loose coupling and encapsulation.
 - It has support for hot reloading of modules. This basically means removing and adding modules on the fly whilst your core is still running

## <a name="docs" href="#docs">Documentation <small><sup>link</sup></small></a>

 - [nCore 0.x documentation][3]    
 - [Module format][10]
    - [define][11]
    - [inject][12]
    - [expose][13]
    - [init][22]
 - [Core][21]
    - [Core.interfaces][9]
    - [Core.constructor][8]
    - [Core.use][4]
    - [Core.init][5]
    - [Core.remove][6]
    - [Core.purge][7]

## <a name="module" href="#module">Module format <small><sup>link</sup></small></a>

A module has a few public properties that are used by the Core.

A module defines it's own public interface through [`define`][11] and accepts it's dependencies through [`inject`][12]. Alternatively a module can define it's dependencies through [`expose`][13] and alternatively if the module has no [`inject`][12] method the dependencies are mixed into the module. 

A module also has an [`init`][22] method which is invoked when the core is done initializing.

Modules are handled in three step phases, 

 1. First is the [`define`][11] phase where every module that is used defines it's public interface. Define is called once a module is used on the core
 2. Second is the [`inject`][12] phase where every module has it's dependencies injected into it. This phase is started when the someone invokes init on the core. In the inject phase modules can do asynchronous startup like opening database connections or asynchronously loading config data from files.
 3. Lastly is the [`init`][22] phase, this happens after every module says it's done injecting. This also happens after the callback on [`Core.init`][5]. This phase is meant to start your application like starting your HTTP server.

### <a name="define" href="#define">`module.define(interface)` <small><sup>link</sup></small></a>

A module is the implementation of an interface. When other modules want to interact with it, they should interact through a public interface. The way to define the public interface of a module is by defining an interface.

Note that the public interface passed to other modules and exposed as [`Core.interfaces`][9] is actually a proxy of the interface created through define. This means that it has all the same properties and it's methods are thin wrappers that call the real interface. This allows for the interface to change at run-time without other modules having references to dead interfaces. This is needed for hot reloading.

The core invokes define when the module is used

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    // define an interface
    define: function (interface) {
        interface.method = function () {
            ...
        }
    }
})

assert(Core.interfaces.name.method)
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    pd = require("pd"),
    assert = require("assert");

Core.use("name", {
    define: function (interface) {
        pd.extend(interface, {
            method: this.method,
            public: this.public,
            otherMethod: this.otherMethod
        })
    },
    method: function () {
        // this is the module
        this.counter++;
    },
    otherMethod: function () {
        return this._getCounter();
    },
    _getCounter: function () {
        return this.counter;
    },
    public: function () {
        this.private();
    },
    private: function () {
        this.emit("foobar");
    }
})

var name = Core.interfaces.name;
name.method();
assert.equal(name.otherMethod(), 1);
name.on("foobar", function () {
    assert(true);
})
name.public();
assert(!name.private);
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    define: {
        method: function () {
            // this is actually the module, not the interface
            return this.private()
        }
    },
    private: function () {
        return 42;
    }
})

assert.equal(Core.interfaces.name.method(), 42);
```

### <a name="inject" href="#inject">`module.inject(deps, [done])` <small><sup>link</sup></small></a>

A module exposes an inject method which is used to handle the dependencies that are injected. It also has an optional done callback to allow the module to do asynchronous startup procedures.

The core invokes inject when the core is initialized

``` javascript
var Core = Object.create(require("ncore")).constructor({
        foo: {
            bar: "bar"
        }
    }),
    assert = require("assert");

Core.use("bar", barObject);

Core.use("foo", {
    inject: function (deps) {
        // deps.bar is the "bar" interface
        assert.equal(deps.bar, Core.interfaces.bar);
    }
})

Core.init()
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert");

Core.use("foo", {
    inject: function (_, done) {
        // Do asynchronous startup
        initializeDatabase(configSettings, done);
    }
})

Core.init(function () {
    // all modules are done
    doStuff();
})
```

``` javascript
var Core = Object.create(require("ncore")).constructor({
        foo: {
            bar: "bar"
        }
    }),
    assert = require("assert")

Core.use("bar", barObject);

Core.use("foo", {
    // if a module has no inject method
    // then dependencies are mixed into the module
    init: function() {
        assert(this.bar);
    }
})

Core.init()
```

### <a name="expose" href="#expose">`module.expose` <small><sup>link</sup></small></a>

Instead of defining an interface you can say what parts of the module should be exposed. Expose should contain an array containing the propertyNames that should become part of the interface

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    public: function () {
        this.private();
    },
    private: function () {
        // this is also an event emitter
        this.emit("somethingHappened");
    },
    expose: ["public"]
})

Core.interfaces.name.on("somethingHappened", function () {
    assert(true);
})
Core.interfaces.name.public();
assert(!Core.interfaces.name.private)
```

### <a name="module.init" href="#module.init">`module.init()` <small><sup>link</sup></small</a>

A module exposes an init method which is invoked when the core is done initializing.

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    inject: function () {
        assert("happens first");
    },
    init: function () {
        assert("happens third");
    }
})

Core.init(function () {
    assert("happens second")
})
```

## <a name="core" href="#core">`Core` <small><sup>link</sup></small></a>

The Core is an object you attach modules to. It keeps a record of the dependency mapping between modules and initializes multiple modules with their correct dependencies.

### <a name="interfaces" href="#interfaces">`Core.interfaces` <small><sup>link</sup></small></a>

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

### <a name="constructor" href="#constructor">`Core.constructor(deps, [ee])` <small><sup>link</sup></small></a>

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
        // that is the interface of bazObject
        assert.equal(deps.bar, Core.interfaces.bar);
    }
});

Core.init()
```

``` javascript
var ncore = require("ncore");

// constructor also accepts strings as arguments
var Core = Object.create(ncore).constructor(require("./dependency.json"));
```

``` javascript
var ncore = require("ncore"),
    EventEmitter = require("eventemitter2").EventEmitter.prototype;

var Core = Object.create(ncore).constructor(null, EventEmitter);

Core.use("bar", {});

Core.init()

// The bar interface is now an EventEmitter2 instance
assert(Core.interfaces.bar.many)
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
  [22]: https://github.com/Raynos/ncore#module.init
# nCore [![Build Status][1]][2]

A transparent dependency injection library based on file based dependency config. Handles initialization, bootstrapping and dependency injection for you.

## Status: Production Ready

 - [example][14]
 - [motivation][15]
 - [docs][16]
 - [Installation][17]
 - [test][18]
 - [contributors][19]
 - [licence][20]

***

## <a name="example" href="#example">Example</a>

    var Core = Object.create(require("nCore")).constructor({
            server: {
                controller: "hello-world"
            }
        }),
        http = require("http")

    Core.use("hello-world", {
        print: function (res) {
            res.end("hello world")
        }
    })

    Core.use("server", {
        init: function () {
            http.createServer(this.handleRequest).listen(8080)
        },
        handleRequest: function (req, res) {
            this.controller.print(res)
        }
    });

    Core.init()
    
Or using the file based loader

    // ./hello-world.js
    module.exports = {
        print: function (res) {
            res.end("hello world")
        }
    }
    
    // ./server.js
    var http = require("http")
    
    module.exports = {
        init: function () {
            http.createServer(this.handleRequest).listen(8080)
        },
        handleRequest: function (req, res) {
            this.controller.print(res)
        }
    }
       
    // dependency.json
    {
        "./server.js": {
            "controller": "./hello-world.js"
        }
    }

### <a name="further" href="#further"> Further examples </a>

 - [simple][32]
 - [files][33]
 - [express][34]
 - [fyp, entire app build with ncore][42]

***

## <a name="motivation" href="#motivation">Motivation</a>

nCore is a dependency injection framework.

 - It strictly defines what a unit is and makes it easy to mock out that unit's dependencies. This makes testing and TDD easy
 - It injects dependencies into your modules and allows you to define the public interface of a module either using methods or using event emitters. This allows for loose coupling and encapsulation.
 - It has support for hot reloading of modules. This basically means removing and adding modules on the fly whilst your core is still running
 - It gives you tiered infrasture to define your objects, bootstrapping and application initialization
 - It allows you to auto load all your modules from file and set up dependency mappings based on file based relations
 - Works with node and the browser! (only 1.3KB min & gzipped)

***

## <a name="docs" href="#docs">Documentation</a>

 - [nCore 0.x documentation][3]
 - [CLI for browsers][30]
 - [Module format][10]
     - [setup][11]
     - [expose][13]
     - [init][22]
     - [destroy][23]
 - [Core][21]
     - [Core.interfaces][9]
     - [Core.dependencies][24]
     - [Core.constructor][8]
     - [Core.use][4]
     - [Core.init][5]
     - [Core.remove][6]
     - [Core.purge][7]
 - [modules][25]
     - [moduleLoader][26]
         - [moduleLoader.load][27]

***

## <a name="cli" href="#cli">CLI</a>

nCore gives you a CLI to build a browser bundle using browserify with the same
syntax as the [moduleLoader][26]

This means you can set up your modules folder and you dependency.json file 
directly inside your modules folder then just

`$ ncore ./modules/ -o /build/bundle.js`

And that's it. Everything just works. All the modules are loaded, bundled, 
attached to the core, nCore is loaded, the core is initialized.

See [test/modules][31] for an example

***

## <a name="module" href="#module">Module format</a>

 - [setup][11]
 - [expose][13]
 - [init][22]
 - [destroy][23]

A module has a few public properties that are used by the Core.

A module can define it's dependencies through [`expose`][13] and the dependencies are mixed into the module.

A module also has an [`init`][22] method which is invoked when the core is done initializing and a [`setup`][12] method which is invoked before init to do asynchronous setup logic for that module

Modules are handled in four phases, 

 1. First is the interface definition phase where every module that is used exposes it's public interface. The core extracts the exposed interface once the module is used.
 2. Second is the dependency injection phase where every module has it's dependencies injected into it. This phase is started when the someone invokes init on the core. 
 3. Thirdy is the [`setup`][11] phase, where modules can do asynchronous setup up logic. This happens after all dependencies are injected into all modules
 4. Lastly is the [`init`][22] phase, this happens after every module says it's done it's setup. This also happens after the callback on [`Core.init`][5]. This phase is meant to start your application like starting your HTTP server.

### <a name="setup" href="#setup">`module.setup`</a>

The optional setup method allows a module to setup logic

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("db", {
    setup: function (done) {
        db.openConnection(done)
    }
})

Core.init()
```

### <a name="expose" href="#expose">`module.expose`</a>

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
``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    public: function () {
        this.private();
    },
    otherPublic: function () {
        // this is also an event emitter
        this.emit("somethingHappened");
    }
})

Core.interfaces.name.on("somethingHappened", function () {
    assert(true);
})
Core.interfaces.name.public();
assert(Core.interfaces.name.otherPublic)
```

### <a name="module.init" href="#module.init">`module.init()`</a>

A module exposes an init method which is invoked when the core is done initializing.

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    setup: function () {
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

### <a name="destroy" href="#destroy">`module.destroy()`</a>

The destroy method is invoked when the module is removed from the core. This is the cleanup method, here your supposed to clean up any coupling to other modules and destroy any state/objects that still exist

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    bigObject = new BigObject();

Core.use("name", {
    destroy: function () {
        // clean objects from memory
        bigObject = null;
    }
})

Core.remove("name");
```

***

## <a name="core" href="#core">`Core`</a>

 - [Core.interfaces][9]
 - [Core.dependencies][24]
 - [Core.constructor][8]
 - [Core.use][4]
 - [Core.init][5]
 - [Core.remove][6]
 - [Core.purge][7]

The Core is an object you attach modules to. It keeps a record of the dependency mapping between modules and initializes multiple modules with their correct dependencies.

### <a name="interfaces" href="#interfaces">`Core.interfaces`</a>

The Core has a public property named interfaces that contains all the public interfaces attached to the core.

A public interface is a proxy of the internal interface (the one passed to define) which means it has all the same properties / methods, it just has a thin proxy that invokes them indirectly. This proxy exist for easy module hot reloading.

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert");

Core.use("name", {
    method: function () { },
    expose: ["method"]
})

assert(Core.interfaces.name.method);
```

### <a name="dependencies" href="#dependencies">`Core.dependencies`</a>

The Core exposes it's dependency mapping as `Core.dependencies`. This can be manipulated after the constructor is invoked

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    init: function () {
        assert(this.a);
    }
})

Core.use("a", moduleA);

Core.dependencies.name = {
    a: "a"
};

Core.init();
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

var name = Core.use("name", {
    foo: function () {
        return this.bars;
    },
    expose: ["foo"]
})

Core.use("a", moduleA)
Core.use("b", moduleB)

Core.dependencies.name = {
    bars: ["a", "b"]
}

Core.init
assert(name.foo().length === 2)
```

### <a name="constructor" href="#constructor">`Core.constructor(deps, [ee])`</a>

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

var bar = Core.use("baz", bazObject);

Core.use("foo", {
    init: function () {
        // For module foo the deps have been mixed in
        // so this has a bar property
        // that is the interface of bazObject
        assert.equal(this.bar, bar);
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

### <a name="use" href="#use">`Core.use(name, module)`</a>

Use a module to attach it to the Core. The core will ask the module to define it's
public interface. 

Core.use returns the public interface

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    prop: true,
    method: function () {
        // this === module
        this.private()
    },
    private: function () {
        ...
    },
    expose: ["prop", "method"]
})
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    // define the interface as an object
    expose: {
        interface_method: function () {

        }
    }
})
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    public: function () {
        ...
    },
    private: function () {

    },
    expose: ["public"]
})
```

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

var name = Core.use("name", {});

assert.equal(name, Core.interfaces.name);
```

### <a name="init" href="#init">`Core.init([callback])`</a>

init will inject dependencies into modules. It also invokes the init method on modules after they are done with dependency injection.

The optional callback to init will be called after all modules are done with the
setup.

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("bar", barObject);

Core.use("name", {
    setup: function (done) {
        assert(this.bar);
        assert("happens first");
        done();
    },
    init: function () {
        assert("happens third");
    }
})

Core.dependencies.name = {
    bar: "bar"
};

Core.init(function () {
    assert("happens second");
})
```

### <a name="remove" href="#remove">`Core.remove(name)`</a>

Remove the module by that name. This will invoke the destroy method on the module

``` javascript
var Core = Object.create(require("ncore")).constructor(),
    assert = require("assert")

Core.use("name", {
    destroy: function () {
        ...
    }
})

Core.remove("name");
```

### <a name="purge" href="#purge">`Core.purge`</a>

removes all modules

``` javascript
Core.purge();
// Core is clean now
```

***

## <a name="modules" href="#modules">Modules</a>

 - [moduleLoader][26]
     - [moduleLoader.load][27]

nCore comes with a set of default modules implemented to do specific tasks

***

## <a name="moduleLoader" href="#moduleLoader">moduleLoader</a>

- [moduleLoader.load][27]

The moduleLoader exposes an interface to autoLoad modules from a folder. It also
exposes an API to write your dependency map based on files.

``` javascript
var Core = Object.create(require("ncore")).constructor()
    moduleLoader = Core.use("moduleLoader", 
        require("ncore/modules/moduleLoader")),
    path = require("path")

moduleLoader.load({
  uri: path.join(__dirname, "./modules"),
  dependencies: require("./dependencies.json"),
  core: Core,
  callback: init
})
```

### <a name="load" href="#load">`moduleLoader.load(options)`</a>

Call load on the moduleLoader to load all the modules in a folder, moduleLoader
also takes a callback that's called when it's done loading and it also takes
a file based dependencies object.

``` javascript
var Core = Object.create(require("ncore")).constructor()
    moduleLoader = Core.use("moduleLoader", 
        require("ncore/modules/moduleLoader")),
    path = require("path")

moduleLoader.load({
  uri: path.join(__dirname, "./modules"),
  dependencies: require("./dependencies.json"),
  core: Core,
  callback: init
});

function init(err) {
  if (err) {
    return console.log("error loading", err, err.stack);
  }
  Core.init();
}
```

``` javascript
// dependencies.json format
{
    // bar and foo will be injected into module located at foo.js
    "./foo.js": {
        // value of bar will be /bar/bar.js
        "bar": "./bar/bar.js",
        // value of foo will be the module inside folder /bar/ that matches the same fileName as this module
        // in this case that would be foo.js
        "foo": "./bar/"
    },
    // foo, bars and foobar will be injected into all modules located directly under folder bar
    "./bar/": {
        // value of foo will be fine /foo.js
        "foo": "./foo.js",
        // value of bars will be an (unsorted) array containing all modules directly under folder bar
        "bars": ["./bar/"],
        // value of foobar will be the module matching the same fileName under bar as the current
        // module fileName (i.e. itself, for each module under bar)
        "foobar": "./bar/"
    }
}
```

***

## <a name="install" href="#install">Installation</a>

`$ npm install ncore`

***

## <a name="test" href="#test">Test</a>

`$ make test`

***

## <a name="contributors" href="#contributors">contributors</a>

 - [Raynos][29]

***

## <a name="licence" href="#licence">MIT Licenced</a>

***

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
  [11]: https://github.com/Raynos/ncore#setup
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
  [23]: https://github.com/Raynos/ncore#destroy
  [24]: https://github.com/Raynos/ncore#dependencies
  [25]: https://github.com/Raynos/ncore#modules
  [26]: https://github.com/Raynos/ncore#moduleLoader
  [27]: https://github.com/Raynos/ncore#load
  [28]: https://github.com/Raynos/ncore#finishedLoading
  [29]: https://github.com/Raynos
  [30]: https://github.com/Raynos/ncore#cli
  [31]: https://github.com/Raynos/ncore/tree/master/test/modules
  [32]: https://github.com/Raynos/ncore/tree/master/examples/simple
  [33]: https://github.com/Raynos/ncore/tree/master/examples/files
  [34]: https://github.com/Raynos/ncore/tree/master/examples/express
  [42]: https://github.com/Raynos/fyp
# nCore [![Build Status][1]][2]

A Core library for your node application infrastructure.

## Status: Beta

## Example

```javascript
var Core = require("nCore"),
	http = require("http");

Core.module("helloworld controller", {
	attach: function _attach() {
		this.mediator.on("helloworld", this.handleHelloWorld);
	},
	handleHelloWorld: function _handleHelloWorld(res) {
		res.end("hello world");
	}
});

Core.module("helloworld server", {
	init: function _init() {
		var server = http.createServer(this.handleRequest);
		server.listen(4000);
	},
	handleRequest: function _handleRequest(req, res) {
		this.mediator.emit("helloworld", res);
	}
});

Core.emit("init");

console.log("server ready");
```

## Motivation

nCore is very similar to [broadway][3] except it has a different set of emphasis.

nCore is used to as a very minimal core to your entire application. Your entire application is made of nCore compliant modules. At bootstrap you load up all your modules into the core and then start the core.

The idea is also for all your modules to communicate through the mediator (which is the core).

 - nCore strictly defines a unit and makes mocking trivial. This means unit testing and TDD is real easy
 - nCore gives you a mediator and enables loosely coupled EDA style architecture
 - nCore gives you infrastructure for run-time module addition and removal to your application core

## Articles

 - [Live coding architecture](http://programmers.stackexchange.com/a/130535/4642)

## Documentation <a name="docs" href="#docs"><small><sup>link</sup></small></a>

 - [Modules][4]
 - [Core][5]
 - [moduleLoader][6]

### Modules <a name="modules" href="#modules"><small><sup>link</sup></small></a>

A module is just an object.

```javascript
{
	attach: function (mediator) { 
		/* Called when someone uses this module on the core */
	},
	detach: function (mediator) {
		/* Called when someone removes the module from the core */
	},
	init: function () {
		/*
			Called when someone emits "init" on the core
			Only attached if using the .module method
		*/
	},
	destroy: function () {
		/*
			Called when someone emits "destroy" on the core
			Only attached if using the .module method
		*/
	}
}
```

Generally a modules live cycle is attach -> init -> destroy -> detach

### Core.use(...) <a name="core.use" href="#core.use"><small><sup>link</sup></small></a>

Core.use allows you to attach a module to the core. The core will invoke the attach method on your module. Note that the mediator is the core, which is an event emitter.

```javascript
Core.use("name", {
	attach: function (mediator) {
		...
	}
});
```

Core.use is overloaded to support multiple invocations

```javascript
Core.use("name", module)
Core.use({ moduleName: moduleOne, otherModuleName: moduleTwo });
```


### @emit init <a name="core.init" href="#core.init"><small><sup>link</sup></small></a>

When attaching modules using the module method they listen on the "init" event.

So to invoke init on all your modules just emit init

```javascript
Core.module("name", {
	init: function () {
		/* do stuff */
	}
});

Core.emit("init");
```

### Core.remove(...) <a name="core.remove" href="#core.remove"><small><sup>link</sup></small></a>

Core.remove removes a module from the core. This will invoke the detach method on the module.

```javascript	
Core.remove("name");
```

Core.remove is also overloaded

```javascript
Core.remove({ firstName: anything, secondName: anythingOther });
```

### @emit destroy <a name="core.destroy" href="#core.destroy"><small><sup>link</sup></small></a>

When attaching modules using the module method they listen on the "destroy" event

So to invoke destroy on all your modules just emit destroy

```javascript
Core.module("name", {
	destroy: function () {
		/* do stuff */
	}
});

Core.emit("destroy");
```

### Core.constructor(ee) <a name="core.constructor" href="#core.constructor"><small><sup>link</sup></small></a>

Core.constructor initializes the core. 

You can pass an event emitter object along to have it mixed in. For example if you want to use EventEmitter2 instead of EventEmitter-light you can pass it along

``` javascript
Core.constructor(require("eventemitter2").EventEmitter)
```

### Core.module(...) <a name="core.module" href="#core.module"><small><sup>link</sup></small></a>

Core.module attaches a module to the core. This is virtually the same as use except a module has `this.mediator` set to be the mediator and all the methods of the module are bound to the module using `.bindAll`.

It also binds the init and destroy methods of the object to the init and destroy
events on the core.

```javascript
Core.module("name", {
	attach: function () {
		doSomethingAsync(this.doThings);
	},
	doThings: function () {
		this.mediator.on('foo', this.handleFoo);
	},
	handleFoo: function () {
		/* ... */
	}
});
```

### Core.purge() <a name="purge" href="#purge"><small><sup>link</sup></small></a>

Core.purge detaches all modules from the core and cleans up the event listeners. It puts the core into a clean state.

``` javascript
Core.emit("destroy"); // destroy all modules
Core.purge(); // clean the core
```

### mediator.method(name, function) <a name="method" href="#method"><small><sup>link</sup></small></a>

mediator.method attaches a "method" to the core. This is basically adding a listener to a single event with the concept being that you want to use the mediator to invoke methods on a module


``` javascript
Core.module("mymodule", {
	attach: function () {
		this.mediator.method("mymodule.methodName", this.methodName);
	},
	methodName: function (data, callback) {
		doStuffAsync(data, callback);
	}
});
```

### mediator.unmethod(name) <a name="unmethod" href="#unmethod"><small><sup>link</sup></small></a>

Removes a method from the mediator

### mediator.invoke(name, ...) <a name="invoke" href="#invoke"><small><sup>link</sup></small></a>

Invoke a method defined by mediator.method. It should be noted that invoke/method is seperate from emit/on. This is meant to be a way to say "I want some module to do something for me". Rather then events which are "I am doing something, other people can listen to me".

The main difference is events are one emitter, many listeners. Where as methods are one listener, many emitters.

``` javascript
Core.module("mymodule", {
	attach: function () {
		this.mediator.method("mymodule.methodName", this.methodName);
	},
	methodName: function (data, cb) {
		cb(data, and, stuff);
	}
});

Core.module("othermodule", {
	init: function () {
		this.mediator.invoke("mymodule.methodName", data, this.callback)
	}, 
	callback: function (data, and, stuff) {
		...
	}
})
```

## nCore modules documentation

### moduleLoader <a name="moduleLoader" href="#moduleLoader"><small><sup>link</sup></small></a>

The moduleLoader is a ready made nCore module you can use to load other modules

``` javascript
var Core = Object.create(nCore).constructor(),
    moduleLoader = require("ncore/modules/moduleLoader");
    
Core.module("moduleLoader", moduleLoader);
Core.invoke("moduleLoader.autoLoad", __dirname + "/modules", function () {
  // All modules in modules folder have been loaded
  // All done now.
  // emit initialization event
  Core.emit("init");
});
```

### @invoke moduleLoader.load(folder, cb) <a name="moduleLoader.load" href="#moduleLoader.load"><small><sup>link</sup></small></a>

You can ask the moduleLoader to load all the modules located in a folder. The folder is a path to the file and the callback get's
fired when all the modules in it have been loaded. Loading means that they are just found and required.

``` javascript
Core.on("moduleLoader.loaded", function (module, uri) {
 // A module was loaded
});

Core.invoke("moduleLoader.load", uri, function () {
  ...
});
```

### @invoke moduleLoader.autoload(folder, cb) <a name="moduleLoader.autoload" href="#moduleLoader.autoload"><small><sup>link</sup></small></a>

autoloading modules means loading them and then attaching them to the core

``` javascript
Core.on("moduleLoader.attached", function (module, uri) {
  // A module was attached
});

Core.invoke("moduleLoader.autoload", uri, function () {
  // Core is ready with all the modules attached to it.
  time.toParty();
});
```

### @on moduleLoader.loaded(module, uri)

### @on moduleLoader.attached(module, uri)

### @on moduleLoader.error(err)

## Installation

`$ npm install ncore`

## Test

`$ make test`

## contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/flatiron/broadway
  [4]: #modules
  [5]: #core.use
  [6]: #moduleLoader
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

Core.init();

console.log("server ready");
```

## Motivation

nCore is very similar to [broadway][3] except it has a different set of emphasis.

nCore is used to as a very minimal core to your entire application. Your entire application is made of nCore compliant modules. At bootstrap you load up all your modules into the core and then start the core.

The idea is also for all your modules to communicate through the mediator (which is the core).

## Articles

 - [Live coding architecture](http://programmers.stackexchange.com/a/130535/4642)

## Documentation

### Modules

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
			Called when the core starts.
		*/
	},
	destroy: function () {
		/*
			Called when the core is destroyed or the module
			is detached
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

Also note that if the core is already running then the init method on the module will be invoked directly

```javascript
Core.init();
Core.use("name", {
	init: function () {
		/*
			If this particular core is already running.
			i.e. init has already been invoked
			then any module attached will also be initialized,
			i.e. it's init routine gets called
		*/
	}
});
```

### Core.init(...) <a name="core.init" href="#core.init"><small><sup>link</sup></small></a>

Core.init starts your core. When the core is started all your modules are started. Every module should have an init method.

```javascript
Core.use("name", {
	init: function () {
		/* do stuff */
	}
});

Core.init();
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

Core.remove will also invoke destroy if the module has been initialized but has not been destroyed. Destroy is invoked before detach

```javascript
Core.use("name", {
	destroy: function () {
		/* destroy it */
	}
});
Core.init();
Core.remove("name");
```

### Core.destroy(...) <a name="core.destroy" href="#core.destroy"><small><sup>link</sup></small></a>

Core.destroy destroys all modules in the core. It also removes them.

```javascript
Core.destroy();
```

Note that core first destroys all the modules and _only_ then detaches all the modules. This means other modules can react to the destroy actions of modules before all the modules are detached.

### Core.constructor() <a name="core.constructor" href="#core.constructor"><small><sup>link</sup></small></a>

Core.constructor initializes the core. This should only be used if you want multiple seperate cores. You will have to initialize each core unless you want them to share data.

### Core.module(...) <a name="core.module" href="#core.module"><small><sup>link</sup></small></a>

Core.module attaches a module to the core. This is virtually the same as use except a module has `this.mediator` set to be the mediator and all the methods of the module are bound to the module using `.bindAll`.

```javascript
Core.module({
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

## Installation

`npm install ncore`

## Test

`make test`

## constructortributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/flatiron/broadway

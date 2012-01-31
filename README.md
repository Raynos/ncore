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


### init <a name="core.init" href="#core.init"><small><sup>link</sup></small></a>

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

### destroy <a name="core.destroy" href="#core.destroy"><small><sup>link</sup></small></a>

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

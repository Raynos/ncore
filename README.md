# nCore

A Core library for your node application infrastructure.

## Status: Beta

## Example
```javascript
var Core = require("ncore").nCore,
	http = require("http");

Core.use("helloworld controller", {
	attach: function _attach(mediator) {
		mediator.on("helloworld", handleHelloWorld);

		function handleHelloWorld(res) {
			res.end("hello world");
		}
	}
});

Core.use("helloworld server", {
	init: function _init(done, mediator) {
		var server = http.createServer(handleRequest);
		server.listen(4000, done);

		function handleRequest() {
			mediator.emit("helloworld", res);
		}
	}
});

Core.init(onCoreReady);

function onCoreReady() {
	console.log("server ready");
}
```

## Motivation

nCore is very similar to [broadway][3] except it has a different set of emphasis.

nCore is used to as a very minimal core to your entire application. Your entire application is made of nCore compliant modules. At bootstrap you load up all your modules into the core and then start the core.

The idea is also for all your modules to communicate through the mediator (which is the core).

## Documentation

Core should be backwards compatible with broadway

### Core.nCore <a name="core.ncore" href="#core.ncore"><small><sup>link</sup></small></a>

```javascript
var Core = require("ncore").nCore;
```

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
	init: function (done, mediator) {
		/*
			Called when the core starts.

			Note that done must be called to indicate that you
			have finished your module initialization
		*/
	},
	destroy: function (done, mediator) {
		/*
			Called when the core is destroyed or the module
			is detached

			Note that done must be called to indicate that you
			have finished your module destruction
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
Core.use({ name: "name", ... })
Core.use({ moduleName: moduleOne, otherModuleName: moduleTwo });
Core.use("name", {
	attach: function (data, mediator) {
		
	}
}, data);
```

Also note that if the core is already running then the init method on the module will be invoked directly

```javascript
Core.init();
Core.use("name", {
	init: function (done, mediator) {
		/*
			If this particular core is already running.
			i.e. init has already been invoked
			then any module attached will also be initialized,
			i.e. it's init routine gets called
		*/
		done();
	}
}/*, data */, function callback() {
	/* invoked after done is invoked by init */
});
```

### Core.init(...) <a name="core.init" href="#core.init"><small><sup>link</sup></small></a>

Core.init starts your core. When the core is started all your modules are started. Every module should have an init method that takes a done callback as a first parameter. This done callback must be invoked for every module before onReady fires

```javascript
Core.use("name", {
	init: function (done, mediator) {
		/* do stuff */
		done();
	}
});

Core.init(function onReady() {
	/* all modules are ready */
	/* party time */
});
```

### Core.remove(...) <a name="core.remove" href="#core.remove"><small><sup>link</sup></small></a>

Core.remove removes a module from the core. This will invoke the detach method on the module.

```javascript	
Core.remove("name");
```

Core.remove is also overloaded

```javascript
Core.remove({ name: "realName"});
Core.remove({ firstName: anything, secondName: anythingOther });
```

Core.remove will also invoke destroy if the module has been initialized but has not been destroyed. Destroy is invoked before detach

```javascript
Core.use("name", {
	init: function (done) { done(); },
	destroy: function (done, mediator) {
		/* destroy it */
		done();
	}
});
Core.init();
Core.remove("name", function onDestroyFinished() {
	/* module was destroyed */
});
```

### Core.destroy(...) <a name="core.destroy" href="#core.destroy"><small><sup>link</sup></small></a>

Core.destroy destroys all modules in the core. It also removes them.

```javascript
Core.destroy(function onDestroyCompleted() {
	/* all modules destroyed and detached */
});
```

Note that core first destroys all the modules and _only_ then detaches all the modules. This means other modules can react to the asynchronous destroy actions of modules before all the modules are detached.

### Core.constructor() <a name="core.constructor" href="#core.constructor"><small><sup>link</sup></small></a>

Core.constructor initializes the core. This should only be used if you want multiple seperate cores. You will have to initialize each core unless you want them to share data.

## Installation

npm install ncore

## Test

npm test

## constructortributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/flatiron/broadway

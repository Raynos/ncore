# nCore[![Build Status][1]][2]

A Core library for your node application infrastructure.

## Status: Beta

## Example

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

## Motivation

nCore is very similar to [broadway][3] except it has a different set of emphasis.

nCore is used to as a very minimal core to your entire application. Your entire application is made of nCore compliant modules. At bootstrap you load up all your modules into the core and then start the core.

The idea is also for all your modules to communicate through the mediator (which is the core).

## Documentation

## Installation

npm install ncore

## Test

npm test

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/flatiron/broadway

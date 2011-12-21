# nCore

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

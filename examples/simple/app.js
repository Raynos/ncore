var Core = require("../../src/core").nCore,
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

		function handleRequest(req, res) {
			mediator.emit("helloworld", res);
		}
	}
});

Core.init(onCoreReady);

function onCoreReady() {
	console.log("server ready");
}
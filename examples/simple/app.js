var Core = require("../../lib/core").constructor(),
	http = require("http");

Core.module("helloworld controller", {
	attach: function attach() {
		this.mediator.on("helloworld", this.handleHelloWorld);
	},
	handleHelloWorld: function handleHelloWorld(res) {
		res.end("hello world");
	}
});

Core.module("helloworld server", {
	init: function init(done) {
		var server = http.createServer(this.handleRequest);
		server.listen(4000, done);
	},
	handleRequest: function handleRequest(req, res) {
		this.mediator.emit("helloworld", res);
	}
});

Core.init(function () {
  console.log("server ready");
});


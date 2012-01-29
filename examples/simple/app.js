var Core = require("../../lib/core").constructor(),
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
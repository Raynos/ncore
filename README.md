# nCore

A Core library for your node application infrastructure.

## Example

	var Core = require("ncore"),
		http = require("http");

	Core.use({
		attach: function (mediator) {
			mediator.on("helloworld", function (res) {
				res.end("hello world");
			});
		}
	});

	Core.use({
		init: function (done, mediator) {
			var server = http.createServer(function (req, res) {
				mediator.emit("helloworld", res);
			});
			server.listen(4000, done);
		}
	});

	Core.init();

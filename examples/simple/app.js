var Core = Object.create(require("../../lib/core")).constructor({
        server: {
            controller: "hello-world"
        }
    }),
    http = require("http");

Core.use("hello-world", {
    define: {
        print: function (req, res) {
            res.end("hello world");
        }
    }
})

Core.use("server", {
    inject: function (deps) {
        http.createServer(function (req, res) {
            deps.controller.print(req, res);
        }).listen(8080);
    }
});

Core.init();
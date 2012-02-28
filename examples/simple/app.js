var Core = Object.create(require("../../lib/core")).constructor({
        server: {
            controller: "hello-world"
        }
    }),
    http = require("http");

Core.use("hello-world", {
    print: function (res) {
        res.end("hello world");
    },
    expose: ["print"]
})

Core.use("server", {
    init: function () {
        http.createServer(this.handleRequest).listen(8080);
    },
    handleRequest: function (req, res) {
        this.controller.print(res);
    }
});

Core.init();
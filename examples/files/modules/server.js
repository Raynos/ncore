var http = require("http")

module.exports = {
    stack: [],
    init: function () {
        http.createServer(this.handleRequest).listen(8080)
        this.emit("serverReady")
    },
    handleRequest: function (req, res) {
        this.stack.forEach(function (layer) {
            layer(req, res)
        })
    },
    use: function (layer) {
        this.stack.push(layer)
    },
    expose: ["use"]
}
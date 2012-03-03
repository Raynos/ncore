var express = require("express")

module.exports = {
    setup: function boot() {
        this.server.on("started", this.start)
    },
    start: function start(server) {
        var app = express()
        this.emit("started", app)
        server.on("request", app)
    }
}
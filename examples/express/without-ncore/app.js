
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = [require('./routes/home')],
    configure = require('./configure')

var app = express();

configure.start(app)

routes.forEach(function (route) {
    route.start(app)
})

module.exports = {
    start: function (server) {
        server.on("request", app)
    }
}
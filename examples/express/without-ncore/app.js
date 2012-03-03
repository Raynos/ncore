
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = [require('./routes/home')],
    configure = require('./configure')

module.exports = {
    start: function (server) {
        var app = express();

        configure.start(app)

        routes.forEach(function (route) {
            route.start(app)
        })
        
        server.on("request", app)
    }
}
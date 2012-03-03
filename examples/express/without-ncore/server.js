var http = require("http"),
    app = require("./app")

module.exports = {
    init: function init() {
        var server = http.createServer().listen(3000)
        app.start(server)

        console.log("Express server listening on port 3000")
    }
}
var http = require("http")

module.exports = {
    init: function init() {
        var server = http.createServer().listen(3000)
        this.app.start(server)

        console.log("Express server listening on port 3000")
    }
}
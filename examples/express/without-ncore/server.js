var http = require("http"),
    app = require("./app")

var server = http.createServer().listen(3000)
app.start(server)

console.log("Express server listening on port 3000")
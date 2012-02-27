module.exports = {
    inject: function (deps) {
        deps.server.on("serverReady", this.attachController)
    },
    attachController: function (server) {
        server.use(function (req, res) {
            res.end("hello world")
        })
    }
}
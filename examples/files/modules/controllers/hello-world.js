module.exports = {
    boot: function () {
        this.server.on("serverReady", this.attachController)
    },
    attachController: function (server) {
        this.server.use(function (req, res) {
            res.end("hello world")
        })
    }
}
module.exports = {
    setup: function () {
        this.app.on("started", this.start)
    },
    start: function (app) {
        app.get("/", function(req, res){
            res.render('index', { title: 'Express' })
        })
    }
}
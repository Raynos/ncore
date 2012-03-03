module.exports = {
    start: function (app) {
        app.get("/", function(req, res){
            res.render('index', { title: 'Express' })
        })
    }
}
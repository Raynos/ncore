var Core = Object.create(require("../../lib/core")).constructor(),
    moduleLoader = Core.use("moduleLoader", 
        require("../../modules/moduleLoader")),
    path = require("path")

moduleLoader.load({
    uri: path.join(__dirname, "./modules"),
    core: Core,
    dependencies: require("./dependency.json"),
    callback: init
})

function init(err) {
    if (err) {
        return console.log("error happened", err)
    }
    Core.init()
}
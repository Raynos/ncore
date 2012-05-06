var moduleLoader = require("./moduleLoader"),
    extend = require("pd").extend,
    ncore = require("..")

var CORE_DEFAULTS = {
    core: extend({}, ncore).constructor()
}

module.exports = {
    core: function (options, callback) {
        options = extend(CORE_DEFAULTS, options)
        if (!options.moduleLoader.core) {
            options.moduleLoader.core = options.core
        }

        var Core = options.core

        var moduleLoader = Core.add("moduleLoader", moduleLoader)

        moduleLoader.load(options.moduleLoader, next)

        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err)
                }
                console.log("Error occurred in core.core", err)
            }
            Core.init(callback)
        }
    }
}
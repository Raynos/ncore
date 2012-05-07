var moduleLoader = require("./moduleLoader"),
    dependencyMapper = require("./dependencyMapper"),
    extend = require("pd").extend,
    ncore = require("..")

var CORE_DEFAULTS = {
    moduleLoader: {},
    dependencyMapper: {}
}

module.exports = core

function core(options, callback) {
    options = extend(CORE_DEFAULTS, options)
    if (!options.core) {
        options.core = extend({}, ncore).constructor()
    }
    if (!options.moduleLoader.core) {
        options.moduleLoader.core = options.core
    }
    if (!options.dependencyMapper.uri && options.uri) {
        options.dependencyMapper.uri = options.uri
    }
    if (!options.moduleLoader.uri && options.uri) {
        options.moduleLoader.uri = options.uri
    }

    var Core = options.core,
        count = 2
        
    Core.add("ncore::moduleLoader", moduleLoader)
    Core.add("ncore::dependencyMapper", dependencyMapper)
    Core.add("ncore::core", core)

    moduleLoader.load(options.moduleLoader, next)
    dependencyMapper.map(options.dependencyMapper, next)

    return Core

    function next(err, deps) {
        if (err) {
            if (callback) {
                return callback(err)
            }
            console.log("Error occurred in core.core", err)
        }

        if (deps) {
            Core.dependencies = deps
        }

        if (--count === 0) {
            Core.init(callback)    
        }
    }
}
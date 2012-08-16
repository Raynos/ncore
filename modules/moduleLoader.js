var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    ncore = require(".."),
    after = require("after"),
    iterateFiles = require("iterate-files")

var MODULE_LOADER_DEFAULTS = {
        uri: path.join(process.cwd(), "modules"),
        skip: /client/
    }

module.exports = {
    /*
        Loads modules and adds them to the core

        @param {Object} options 
            {
                Core: The core
                skip: RegExp to skip by
                uri: root uri to load
            }
    */
    load: function (options, callback) {
        options = extend({}, MODULE_LOADER_DEFAULTS, options)
        var modulesFolder = options.moduleLoader.uri

        var json = require(options.dependencyMapper.jsonUri)

        for (var firstLevel in json) {
            if (firstLevel.indexOf('.js') !== -1) {
                var filePath = path.join(process.cwd(), '../../../', firstLevel)
                loadModule(filePath, callback)
            }

            for (var secondLevel in json[firstLevel]) {
                var value = json[firstLevel][secondLevel]

                if (typeof value !== 'object') {
                    var filePath = path.join(process.cwd(), '../../../', value)
                    loadModule(filePath, callback)
                } else {
                    var basePath = path.join(process.cwd(), '../../../', value[0])
                    var files = fs.readdirSync(basePath)

                    for (var file in files) {
                        var filePath = path.join(basePath, files[file])
                        loadModule(filePath, callback)
                    }
                }
            }
        }

        function loadModule(fileName, callback) {
            if (options.moduleLoader.skip && options.moduleLoader.skip.test(fileName)) {
                return
            }

            var module = require(fileName)
            var name = path.relative(options.moduleLoader.uri, fileName)
            options.moduleLoader.core.add(name, module)

            // callback(fileName)
        }
    }
}
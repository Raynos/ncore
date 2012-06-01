var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    ncore = require(".."),
    after = require("after"),
    iterateFiles = require("iterate-files")

var MODULE_LOADER_DEFAULTS = {
        uri: path.join(process.cwd(), "modules"),
        skip: /client/
    },
    isJsFile = /.js$/

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
        var modulesFolder = options.uri

        iterateFiles(modulesFolder, loadModule, callback, isJsFile)

        function loadModule(fileName) {
            if (options.skip && options.skip.test(fileName)) {
                return
            }
            var module = require(fileName)
            var name = path.relative(options.uri, fileName)
            options.core.add(name, module)
        }
    }
}
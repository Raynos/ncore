var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    ncore = require(".."),
    after = require("after")

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
        options = extend(MODULE_LOADER_DEFAULTS, options)
        var modulesFolder = options.uri

        iterateFiles(modulesFolder, loadModule, callback)

        function loadModule(err, fileName) {
            if (err) {
                return callback(err)
            }
            if (options.skip && options.skip.test(fileName)) {
                return
            }
            var module = require(fileName)
            var name = path.relative(options.uri, fileName)
            options.core.add(name, module)
        }
    }
}

function iterateFiles(uri, callback, done) {
    var counter = 1
    fs.readdir(uri, readFiles)

    function readFiles(err, files) {
        if (err) {
            return callback(err)
        }

        counter += files.length
        files.forEach(isDirOrFile)
        next()
    }

    function isDirOrFile(fileName) {
        fileName = path.join(uri, fileName)

        fs.stat(fileName, readOrRecurse)

        function readOrRecurse(err, stat) {
            if (err) {
                return callback(err)
            }

            if (stat.isDirectory()) {
                iterateFiles(fileName, callback, next)
            } else if (stat.isFile() && isJsFile.test(fileName)) {
                callback(null, fileName)
                next()
            } else {
                next()
            }
        }
    }

    function next() {
        if (--counter === 0) {
            done(null)
        }
    }
}
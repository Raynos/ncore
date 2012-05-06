var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    after = require("after")

var DEPENDENCY_WRITE_DEFAULTS = {
        jsonUri: path.join(process.cwd(), "dependencies.json"),
        uri: path.join(process.cwd(), "modules")
    },
    isFile = /.js$/

module.exports = {
    map: function (options, callback) {
        var json = require(options.jsonUri),
            coreDependenciesResult = {}

        after.forEach(json, mapToDependencies, returnResult)

        function mapToDependencies(dependencies, moduleName, callback) {
            var dependenciesResult = {}
            if (isFile.test(moduleName)) {
                after.forEach(dependencies, mapToProxyName, done)
            } else {
                done()
            }

            function mapToProxyName(proxyName, propertyName, callback) {
                dependenciesResult[propertyName] = proxyName
                callback()
            }

            function done() {
                coreDependenciesResult[moduleName] = dependenciesResult
                callback()
            }
        }

        function returnResult(err) {
            callback(err, coreDependenciesResult)
        }
    }
}
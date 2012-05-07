var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    after = require("after")

var DEPENDENCY_WRITE_DEFAULTS = {
        jsonUri: path.join(process.cwd(), "dependencies.json"),
        uri: path.join(process.cwd(), "modules")
    },
    isFile = /.js$/,
    isFileFunction = isFile.test.bind(isFile)

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
                var folderUri = path.join(options.uri, moduleName)
                fs.readdir(folderUri, mapToMultipleFiles)
            }

            function mapToProxyName(proxyName, propertyName, callback) {
                if (isFile.test(proxyName)) {
                    dependenciesResult[propertyName] = proxyName
                    callback()
                } else if (typeof proxyName === "string") {
                    proxyName = path.join(proxyName, path.basename(moduleName))
                    dependenciesResult[propertyName] = proxyName
                    callback()
                } else if (Array.isArray(proxyName)) {
                    var proxyObject = {},
                        folderUri = path.join(options.uri, proxyName[0])

                    fs.readdir(folderUri, mapIntoProxyObject)
                }

                function mapIntoProxyObject(err, files) {
                    if (err) {
                        return callback(err)
                    }
                    files.filter(isFileFunction).forEach(addToProxyObject)
                    dependenciesResult[propertyName] = proxyObject
                    callback()
                }

                function addToProxyObject(fileName) {
                    var propertyName = fileName.replace(isFile, "")

                    proxyObject[propertyName] = 
                        path.join(proxyName[0], fileName)
                }
            }

            function mapToMultipleFiles(err, files) {
                if (err) {
                    return callback(err)
                }
                after.forEach(files, addFileToDependencies, callback)

                function addFileToDependencies(fileName, callback) {
                    fileName = path.join(moduleName, fileName)
                    mapToDependencies(dependencies, fileName, callback)
                }
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
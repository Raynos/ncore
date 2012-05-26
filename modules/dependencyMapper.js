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
    /*
        <moduleNameLeft>: {
            <propertyName>: <moduleNameRight>
        }
    */
    map: function (options, callback) {
        var json = require(options.jsonUri)

        // the JSON DSL has the option to have "/foo" in <moduleNameLeft>
        after.reduce(json, createFoldersIntoFilesIterator(options.uri), 
            {}, runDependencyMapper)

        function runDependencyMapper(err, data) {
            if (err) {
                return callback(err)
            }
            after.map(data, mapToDependencies, callback)
        }

        function mapToDependencies(dependencies, moduleName, callback) {
            if (isFile.test(moduleName)) {
                // the JSON DSL has the option to have "/foo" or ["/foo"]
                // in <moduleNameRight>.
                after.map(dependencies, createConvertToProxyNameIterator({
                    moduleName: moduleName,
                    uri: options.uri
                }), callback)
            }
        }
    }
}

function createFoldersIntoFilesIterator(uri) {
    return unpackFolderNames
    
    function unpackFolderNames(memo, dependencies, moduleName, callback) {
        if (isFile.test(moduleName)) {
            memo[moduleName] = dependencies
            callback(null, memo)
        } else {
            var folderUri = path.join(uri, moduleName)
            fs.readdir(folderUri, mapToMultipleFiles)
        }

        function mapToMultipleFiles(err, files) {
            if (err) {
                return callback(err)
            }
            files.forEach(addFileToDependencies)
            callback(null, memo)
        }

        function addFileToDependencies(fileName) {
            fileName = path.join(moduleName, fileName)
            memo[fileName] = dependencies
        }
    }
}

function createConvertToProxyNameIterator(options) {
    return mapToProxyName

    function mapToProxyName(proxyName, propertyName, callback) {
        if (isFile.test(proxyName)) {
            callback(null, proxyName)
        } else if (typeof proxyName === "string") {
            proxyName = path.join(proxyName, path.basename(options.moduleName))
            callback(null, proxyName)
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
            callback(null, proxyObject)
        }

        function addToProxyObject(fileName) {
            var propertyName = fileName.replace(isFile, "")

            proxyObject[propertyName] = 
                path.join(proxyName[0], fileName)
        }
    }
}
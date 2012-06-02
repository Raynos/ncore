var fs = require("fs"),
    path = require("path"),
    extend = require("pd").extend,
    after = require("after"),
    iterateFiles = require("iterate-files")

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
        options = extend({}, DEPENDENCY_WRITE_DEFAULTS, options)
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
            iterateFiles(folderUri, addFileToDependencies, returnMemo)
        }

        function addFileToDependencies(fileName) {
            fileName = path.relative(uri, fileName)
            memo[fileName] = dependencies
        }

        function returnMemo(err)  {
            if (err) {
                return callback(err)
            }
            callback(null, memo)
        }
    }
}

function createConvertToProxyNameIterator(options) {
    return mapToProxyName

    /*
        proxyname is like /foo
        propertyName is the property
    */
    function mapToProxyName(proxyName, propertyName, callback) {
        if (isFile.test(proxyName)) {
            callback(null, proxyName)
        } else if (typeof proxyName === "string") {
            findProxyName(options.moduleName, proxyName, options.uri, callback)
        } else if (Array.isArray(proxyName)) {
            findProxyObject(options.uri, proxyName[0], callback)
        }
    }
}

/*
    moduleName is the address of this module relative to uri

    proxyName is the thing like foo or bar/foo

    uri is the uri of the entire folder
*/
function findProxyName(moduleName, proxyName, uri, callback) {
    var base = path.basename(moduleName),
        proxyUri = path.join(uri, proxyName, base)

    fs.stat(proxyUri, checkIfProxyExists)

    function checkIfProxyExists(err, stat) {
        if (err) {
            if (proxyUri.substr(-3, 3) === ".js") {
                proxyUri = proxyUri.substr(0, proxyUri.length - 3)
            } else {
                proxyUri = proxyUri + ".js"
            }

            fs.stat(proxyUri, checkIfChangedUriHelped)
        } else {

            callback(null, path.relative(uri, proxyUri))
        }
    }

    function checkIfChangedUriHelped(err, stat) {
        if (err) {
            moduleName = path.dirname(moduleName)

            findProxyName(moduleName, proxyName, uri, callback)
        } else {

            if (proxyUri.substr(-3, 3) === ".js")  {
                callback(null, path.relative(uri, proxyUri))
            } else {
                findProxyObject(uri, path.relative(uri, proxyUri),
                    callback)
            }
        }
    }
}

/*
    uri of folder structure

    proxyName is the name in the array
*/
function findProxyObject(uri, proxyName, callback) {
    var proxyObject = {},
        folderUri = path.join(uri, proxyName)

    iterateFiles(folderUri, function (fileName) {
        var relativePropertyName = path.relative(folderUri, fileName),
            relativeValue = path.relative(uri, fileName)

        relativePropertyName = relativePropertyName.replace(isFile, "")
        var props = relativePropertyName.split("/")

        props.reduce(function (memo, value, index) {
            if (index === props.length - 1) {
                memo[value] = relativeValue
            } else {
                return (memo[value] = memo[value] || {})
            }
        }, proxyObject)

    }, function (err) {
        callback(err, proxyObject)
    })

    //fs.readdir(folderUri, mapIntoProxyObject)

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
            path.join(proxyName, fileName)
    }
}
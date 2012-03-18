var pd = require("pd"),
    fs = require("fs"),
    path = require("path"),
    events = require("events"),
    after = require("after")

pd.extend(DependencyWriter, {
    getStatsOfURI: function getStatsOfURI() {
        fs.stat(this.uri, this.optionallyReadFolder)
    },
    optionallyReadFolder: function optionallyReadFolder(err, stats) {
        if (err) {
            return this.callback(err)
        }
        if (stats.isFile()) {
            this.relative = makeRelative.call(this)
            this.emitter.emit("dependencySet", this.relative, this.uri)
            after.forEach(this.depObject, this.injectDependency, 
                this, this.callback)
        } else if (stats.isDirectory()) {
            fs.readdir(this.uri, this.writeFileDependencies)
        }
    },
    writeFileDependencies: function readFiles(err, files) {
        if (err) {
            return this.callback(err)
        }
        after.forEach(files, writeDependency, this, this.callback)

        function writeDependency(fileName, done) {
            DependencyWriter({
                uri: path.join(this.uri, fileName),
                depObject: this.depObject,
                originalUri: this.originalUri,
                core: this.core,
                emitter: this.emitter,
                callback: done
            })
        }
    },
    injectDependency: function injectDependency(pattern, name, callback) {
        if (typeof pattern === "string" && pattern.substr(-3) === ".js") {
            var relativeModule = makeRelative.call({
                relative: pattern.substr(2)
            })
            setDependency.call(this, relativeModule)
        } else if (typeof pattern === "string") {
            var relativeModule = makeRelative.call({
                relative: path.join(pattern, 
                    this.relative.slice(this.relative.lastIndexOf(".") + 1))
            })
            setDependency.call(this, relativeModule)
        } else if (Array.isArray(pattern)) {
            var folder = path.join(this.originalUri, pattern[0])
            fs.readdir(folder, mapToDependencies.bind(this))
        } 

        function mapToDependencies(err, files) {
            if (err) {
                return callback(err)
            }
            var deps = {}
            files.forEach(function (fileName) {
                deps[fileName.replace(".js", "")] = makeRelative.call({
                    relative: path.join(pattern[0], fileName)
                })
            }, this)

            setDependency.call(this, deps)
        }

        function setDependency(deps) {
            var dependencies = this.core.dependencies
            if (!dependencies[this.relative]) {
                dependencies[this.relative] = {}
            }
            dependencies[this.relative][name] = deps
            callback()
        }
    }
})

module.exports = DependencyWriter

function DependencyWriter(options) {
    var dw = pd.bindAll({}, DependencyWriter, {
        emitter: new events.EventEmitter
    }, options)
    dw.getStatsOfURI()
    return dw
}

function makeRelative() {
    var relative = this.relative || path.relative(this.originalUri, this.uri)
    relative = relative.replace(".js", "")
    relative = relative.replace(/\//g, ".")
    return relative
}
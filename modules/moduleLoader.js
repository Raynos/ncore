var fs = require("fs"),
    pd = require("pd"),
    after = require("after"),
    path = require("path");

pd.extend(ModuleLoader, {
    getStatsOfURI: function getStatsOfURI() {
        if (!this.originalUri) {
            this.originalUri = this.uri;
        }
        fs.stat(this.uri, this.readFileOrFolder);
    },
    readFileOrFolder: function readFileOrFolder(err, stats) {
        if (err) {
            return this.callback(err);
        }
        if (stats.isFile()) {
            if (this.uri.substr(-3) !== ".js") {
                return this.callback();
            }
            var module = require(this.uri);
            var relative = makeRelative.call(this);
            this.core.use(relative, module);
            this.callback();
        } else if (stats.isDirectory()) {
            fs.readdir(this.uri, this.readFiles);
        }
    },
    readFiles: function readFiles(err, files) {
        if (err) {
            return this.callback(err);
        }
        after.forEach(files, readFile, this, this.callback);

        function readFile(fileName, done) {
            ModuleLoader({
                uri: path.join(this.uri, fileName),
                core: this.core,
                originalUri: this.originalUri,
                callback: done
            });
        }
    }
});

pd.extend(DependencyWriter, {
    getStatsOfURI: function getStatsOfURI() {
        fs.stat(this.uri, this.optionallyReadFolder)
    },
    optionallyReadFolder: function optionallyReadFolder(err, stats) {
        if (err) {
            return this.callback(err);
        }
        if (stats.isFile()) {
            this.relative = makeRelative.call(this);
            after.forEach(this.depObject, this.injectDependency, 
                this, this.callback);
        } else if (stats.isDirectory()) {
            fs.readdir(this.uri, this.writeFileDependencies);
        }
    },
    writeFileDependencies: function readFiles(err, files) {
        if (err) {
            return this.callback(err);
        }
        after.forEach(files, writeDependency, this, this.callback);

        function writeDependency(fileName, done) {
            DependencyWriter({
                uri: path.join(this.uri, fileName),
                depObject: this.depObject,
                originalUri: this.originalUri,
                core: this.core,
                callback: done
            });
        }
    },
    injectDependency: function injectDependency(pattern, name, callback) {
        if (typeof pattern === "string" && pattern.substr(-3) === ".js") {
            var relativeModule = makeRelative.call({
                relative: pattern.substr(2)
            });
            setDependency.call(this, relativeModule);
        } else if (typeof pattern === "string") {
            var relativeModule = makeRelative.call({
                relative: path.join(pattern, 
                    this.relative.slice(this.relative.lastIndexOf(".") + 1))
            })
            setDependency.call(this, relativeModule);
        } else if (Array.isArray(pattern)) {
            var folder = path.join(this.originalUri, pattern[0]);
            fs.readdir(folder, mapToDependencies.bind(this));
        } 

        function mapToDependencies(err, files) {
            if (err) {
                return callback(err);
            }
            files = files.map(function (fileName) {
                return makeRelative.call({
                    relative: path.join(pattern[0], fileName)
                });
            } ,this)

            setDependency.call(this, files)
        }

        function setDependency(deps) {
            var dependencies = this.core.dependencies;
            if (!dependencies[this.relative]) {
                dependencies[this.relative] = {};
            }
            dependencies[this.relative][name] = deps;
            callback();
        }
    }
});

module.exports = {
    /*
        loads all files in the folder. Each file is expected to be a export
            a module which is then attached to the core under a filename

        Modules are stored by the naming convention of <fileName> if directly
            in the folder or <folder>.<fileName>, <folder>.<folder>.<fileName>
            if stored nested in the folder

        @param {Object} options - 
            {
                dependencies: {Object} - A dependency mapping for the
                    files in the folder (uri). This is based on 
                    files/folderNames
                uri: {String} - uri of the folder to load
                callback: {Function} - callback to invoke when all modules
                    are loaded and attached to core. Passes an error if
                    the error occurs
                core: {Object} - instance of the core to attach to
            }
        
    */
    load: function load(options) {
        var counter = 2;

        after.forEach(options.dependencies, writeDependencies, this, next);

        ModuleLoader({
            uri: options.uri,
            core: options.core,
            callback: next
        })

        function next(err) {
            if (err) return options.callback(err)
            --counter === 0 && options.callback()
        }

        function writeDependencies(depObject, fileName, callback) {
            DependencyWriter({
                uri: path.join(options.uri, fileName),
                originalUri: options.uri,
                depObject: depObject,
                core: options.core,
                callback: callback
            });
        }
    },
    expose: ["load"]
};

function DependencyWriter(options) {
    pd.bindAll(pd.extend({}, DependencyWriter, options)).getStatsOfURI();
}

function ModuleLoader(options) {
    pd.bindAll(pd.extend({}, ModuleLoader, options)).getStatsOfURI();
}

function makeRelative() {
    var relative = this.relative || path.relative(this.originalUri, this.uri);
    relative = relative.replace(".js", "");
    relative = relative.replace(/\//g, ".");
    return relative
}
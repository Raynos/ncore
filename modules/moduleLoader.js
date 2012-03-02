var fs = require("fs"),
    pd = require("pd"),
    after = require("after"),
    DependencyWriter = require("./dependencyWriter"),
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
            var module = require(this.uri),
                relative = path.relative(this.originalUri, this.uri);
            relative = relative.replace(".js", "");
            relative = relative.replace(/\//g, ".");
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

        after.forEach(options.dependencies, writeDependencies, next)

        ModuleLoader({
            uri: options.uri,
            core: options.core,
            callback: next
        })

        function next(err) {
            if (err) {
                return options.callback(err)
            }
            if (--counter === 0) {
                options.callback();
            }
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


function ModuleLoader(options) {
    pd.bindAll({}, ModuleLoader, options).getStatsOfURI();
}
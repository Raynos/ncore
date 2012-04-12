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
            if (this.skip) {
                if (this.uri.indexOf(this.skip) !== -1) {
                    return this.callback()
                }
            }
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
                skip: {String} - string to match the folder name again to skip
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
            skip: options.skip,
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
    /*
        core reduces boilerplate by doing default actions
    */
    core: function core(uri, callback) {
        var Core = Object.create(require("..")).constructor()

        Core.use("moduleLoader", this)

        this.load({
            uri: uri,
            core: Core,
            skip: "/client",
            dependencies: require(path.join(uri, "dependency.json")),
            callback: init
        })

        function init(err) {
            if (err) {
                if (callback) {
                    return callback(err)
                }
                console.log("Error occurred in moduleLoader.core", err)
            }
            Core.init(callback)
        }
    },
    expose: ["load", "core"]
};


function ModuleLoader(options) {
    pd.bindAll({}, ModuleLoader, options).getStatsOfURI();
}
var fs = require("fs"),
    pd = require("pd"),
    path = require("path");

/*
    @method 'moduleLoader.load' path cb - loader listens on the module 
        loading command. This will load all the js files in the folder 
        (or the file path) as ncore modules. The callback fires if all
        the modules have been recursively loaded.
    @method 'moduleLoader.autoload' path cb - same as load except it 
        automatically attaches the module to the core
    @emit 'moduleLoader.loaded' module uri - every time a module is loaded 
        an event fires saying the module was attached
    @emit 'moduleLoader.error' error - every time an error occurs an
        error event fires
*/
module.exports = { 
    attach: function attach() {
        this.mediator.method('moduleLoader.load', this.loadModules);
        this.mediator.method('moduleLoader.autoload', this.autoLoadModules);
    },
    detach: function detach() {
        this.mediator.removeListener('moduleLoader.load', this.loadModules);
        this.mediator.removeListener(
            'moduleLoader.autoload', this.autoLoadModules);
        if (this._autoload) {
            this.mediator.removeListener('moduleLoader.loaded', 
                this.attachModuleToCore);
            delete this._autoload;
        }
    },
    autoLoadModules: function autoLoadModules(uri, cb) {
        if (!this._autoload) {
            this._autoload = true;
            this.mediator.on('moduleLoader.loaded', this.attachModuleToCore);    
        }
        this.loadModules(uri, cb);
    },
    attachModuleToCore: function attachModuleToCore(module, uri) {
        this.mediator.module(uri, module);
        this.mediator.emit('moduleLoader.attached', module);
    },
    loadModules: function loadModules(uri, cb) {
        createLoader(uri, this.mediator).loadModules(cb);
    }
};

function createLoader(uri, mediator) {
    var loader = pd.extend({}, Loader);
    loader.uri = uri;
    loader.mediator = mediator;
    return pd.bindAll(loader);
}

var Loader = {
    loadModules: function loadModules(cb) {
        this.cb = cb;
        this.counter = 0;
        fs.stat(this.uri, this.checkIfFolderOrFile);
    },
    checkIfFolderOrFile: function checkIfFolderOrFile(err, stat) {
        if (err) {
            return this.mediator.emit('moduleLoader.error', err);
        }

        if (stat.isDirectory()) {
            fs.readdir(this.uri, this.loadModuleFiles);
        } else if (stat.isFile()) {
            this.counter++;
            this.loadModuleFile()
            this.decrementCounter();
        }
    },
    loadModuleFiles: function loadModuleFiles(err, files) {
        if (err) {
            return this.mediator.emit('moduleLoader.error', err);
        }

        files.forEach(loadModuleFile, this);

        function loadModuleFile(filename) {
            this.counter++;
            createLoader(
                path.join(this.uri, filename),
                this.mediator
            ).loadModules(this.decrementCounter);
        }
    },
    loadModuleFile: function loadModuleFile() {
        var uri = this.uri,
            module = require(uri);

        this.mediator.emit('moduleLoader.loaded', module, uri);
    },
    decrementCounter: function decrementCounter() {
        if (--this.counter === 0) {
            this.cb && this.cb();
        }
    }
};
var fs = require("fs"),
    path = require("path");

/*
    @on 'moduleLoader.load' path - loader listens on the module loading command
        This will load all the js files in the folder (or the file path) as 
        ncore modules
    @on 'moduleLoader.autoload' path - same as load except it automatically
        attaches the module to the core
    @emit 'moduleLoader.loaded' module uri - every time a module is loaded 
        an event fires saying the module was attached
    @emit 'moduleLoader.error' error - every time an error occurs an
        error event fires
*/
var loader = { 
    attach: function attach() {
        this.mediator.on('moduleLoader.load', this.loadModules);
        this.mediator.on('moduleLoader.autoload', this.autoLoadModules);
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
    autoLoadModules: function autoLoadModules(uri) {
        if (!this._autoload) {
            this._autoload = true;
            this.mediator.on('moduleLoader.loaded', this.attachModuleToCore);    
        }
        this.loadModules(uri);
    },
    attachModuleToCore: function attachModuleToCore(module, uri) {
        this.mediator.module(uri, module);
        this.mediator.emit('moduleLoader.attached', module);
    },
    loadModules: function loadModules(uri) {
        fs.stat(uri, this.checkIfFolderOrFile.bind(this, uri));
    },
    checkIfFolderOrFile: function checkIfFolderOrFile(uri, err, stat) {
        if (err) {
            return this.mediator.emit('moduleLoader.error', err);
        }

        if (stat.isDirectory()) {
            fs.readdir(uri, this.loadModuleFiles.bind(this, uri));
        } else if (stat.isFile()) {
            this.loadModuleFile(uri)
        }
    },
    loadModuleFiles: function loadModuleFiles(uri, err, files) {
        if (err) {
            return this.mediator.emit('moduleLoader.error', err);
        }

        files.forEach(loadModuleFile, this);

        function loadModuleFile(filename) {
            this.loadModules(path.join(uri, filename));
        }
    },
    loadModuleFile: function loadModuleFile(uri) {
        var module = require(uri);

        this.mediator.emit('moduleLoader.loaded', module, uri);
    }
};

module.exports = loader;
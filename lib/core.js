var EventEmitter = require("eventemitter-light"),
    pd = require("pd");

/*
    Modules have three phases.

    The definition phase:

        When a module is used on the core, the core will ask the module to 
        define it's interface. This can be done by having a method called 
        define which takes the interface as the first argument. 

        Alternatively this can be done by having a property define which is
        an object that is the interface

        Alternatively this can be done by having a property expose which is
        an array of propertyNames. Those propertyNames are to be taken from
        the module and put into the interface

    The injection phase:

        When the core is initialized all the dependencies are injected into
        all the modules. This injection is based on the dependency mapping
        passed into the core when it's constructed

        A module should have an inject method which accepts the 
        dependencies for the module as the first argument. The inject method 
        also get's an optional done callback as the second argument. This is
        used to tell the core that the module is done doing any asynchronous
        startup logic.

        If the module doesn't have an inject method then the dependencies
        are mixed into the module

    The init phase:

        After all the dependencies are injected into all the modules, the core
        is ready. Then the init method is invoked on modules that have it.

        The init method is used to start your application, i.e. create your 
        HTTP server or start your cron jobs, etc.

    Modules expose a public interface, which is a proxy of the interface
    that the module defines. This proxy is just a thin wrapper that indireclty
    invokes the interfaces methods. This proxy is used to enable hot code
    reload without having to get rid of references to dead objects.

    Note that inside the interfaces methods the thisContext value is the module
    itself.
*/
module.exports = {
    /*
        Construct a Core with dependencies and an optional EventEmitter 
        prototype. 

        The dependencies contain the dependency mapping setup for
        modules, so the core knows what dependencies to inject into what
        modules. 

        The eventemitter prototype is used to choose the eventEmitter 
        implementation that interfaces have.

        @param {Object} dependencies - This is a map of dependencies.
            {
                <ModuleName>: {
                    <PropertyName>: <OtherModuleName>
                }
            }

            This means that <ModuleName> will have a deps object injected with
                a property <PropertyName> which contains the public interface
                of <OtherModuleName>

        @param {Object} ee - An optional EventEmitter prototype. Used if you 
            want the interface to inherit from a different EventEmitter then
            eventemitter-light
    */
    constructor: function constructor(dependencies, ee) {
        var that = this;
        that.interfaces  = {};
        that._ee = ee || EventEmitter;
        that._interfaces = {};
        that._modules = {};
        if (typeof dependencies === "string") {
            that.dependencies = JSON.parse(dependencies);
        } else {
            that.dependencies = dependencies || {};
        }
        return that;
    },
    /*
        This is used to attach a module to the core. When a module is attached
        the core asks the module to define it's interface.
        
        @param {String} name - The name of this module

        @param {Object} module - The implementation of the module. 
    */
    use: function use(name, module) {
        var interface = pd.extend({}, this._ee);
        if (typeof module.define === "function") {
            module.define(interface);
        } else if (module.define) {
            pd.extend(interface, module.define)
        }
        if (Array.isArray(module.expose)) {
            module.expose.forEach(addToInterface);
        }
        this._makeProxy(name, interface, module);

        function addToInterface(name) {
            interface[name] = module[name];
        }
    },
    /*
        
    */
    init: function init(callback) {
        var that = this,
            counter = 1;

        Object.keys(that._interfaces).forEach(invokeInject);
        next();

        function invokeInject(name) {
            var module = that._modules[name],
                deps = {};
            if (that.dependencies[name]) {
                Object.keys(that.dependencies[name]).forEach(mapToInterface);
            }
            if (module.inject) {
                if (module.inject.length === 2)  {
                    counter++;
                }
                module.inject(deps, next);
            } else {
                pd.extend(module, deps);
            }

            function mapToInterface(key) {
                var dependency = that.dependencies[name][key];
                deps[key] = that.interfaces[dependency];
            }
        }

        function next() {
            if (--counter === 0) {
                callback && callback();
                Object.keys(that._modules).forEach(invokeInit);
            }
        }

        function invokeInit(name) {
            var module = that._modules[name];
            module.init && module.init();
        }
    },
    remove: function remove(name) {
        var that = this,
            module = that._modules[name];

        delete that.interfaces[name];
        delete that._interfaces[name];
        delete that._modules[name];

        module.destroy && module.destroy();
    },
    purge: function purge() {
        Object.keys(this.interfaces).forEach(callRemove, this);
        
        function callRemove(name) {
            this.remove(name);
        }
    },
    _makeProxy: function _makeProxy(name, interface, module) {
        var proxy = {},
            that = this;

        Object.keys(interface).forEach(proxyProperty);
        that._interfaces[name] = interface;
        that._modules[name] = module;
        that.interfaces[name] = proxy;

        function proxyProperty(name) {
            var value = interface[name];
            if (typeof value === "function") {
                interface[name] = value.bind(module);
                proxy[name] = proxyFunction(name);
            } else {
                proxy[name] = value;
            }
        }

        function proxyFunction(functionName) {
            return proxy;

            function proxy() {
                return that._interfaces[name][functionName]
                    .apply(this, arguments);
            }
        }
    }
};
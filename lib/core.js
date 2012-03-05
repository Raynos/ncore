"use strict"

var EventEmitter = require("eventemitter-light"),
    pd = require("pd");

/*
    Modules have four phases. The first two are handled for you

    The definition phase:

        When a module is used on the core, the core will inspect the module
            by reading it's expose property. It then copies the methods in the
            expose array out of the array and calls it the interface of the 
            module

        At this the interface is wrapped in a proxy that invokes it indirectly.
            this proxy is the public interface, this indirection is added to
            support hot reloading of interfaces

    Someone calls Core.init() and then the following three phases occur

    The injection phase:

        When the core is initialized all the dependencies are injected into
            all the modules. This injection is based on the dependency mapping
            passed into the core when it's constructed

        Injection basically means mixing in the dependencies into the module

    The setup phase:

        The setup phase happens after dependencies are injected for all the
            modules. In this phase the core calls the setup method of
            the modules with an optional done callback

        This allows modules to do asynchronous setup logic and tell the Core
            "hey I'm ready to go now"

    The init phase:

        After all the modules are ready the init method is invoked on 
            modules that have it.

        The init method is used to start your application, i.e. create your 
            HTTP server or start your cron jobs, etc.

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

        @param {Object} [ee] - An optional EventEmitter prototype. Used if you 
            want the interface to inherit from a different EventEmitter then
            eventemitter-light
    */
    constructor: function constructor(dependencies, ee) {
        var that = this;
        that.interfaces  = {};
        that._ee = ee || EventEmitter;
        that._modules = {};
        that._interfaces = {};
        that.dependencies = dependencies || {};
        return that;
    },
    /*
        This is used to attach a module to the core. When a module is attached
            the core asks the module what interface it exposes
        
        @param {String} name - The name of this module

        @param {Object} module - The implementation of the module. 

        @return {Object} interface - the public interface of this module is
            returned
    */
    use: function use(name, module) {
        var _interface = pd.bindAll({}, this._ee);
        pd.bindAll(module, {
            emit: _interface.emit
        })
        _interface.constructor()
        if (Array.isArray(module.expose)) {
            module.expose.forEach(addToInterface)
        } else {
            pd.extend(_interface, module.expose || module)
        }
        this._makeProxy(name, _interface, module)
        return this.interfaces[name]

        function addToInterface(name) {
            _interface[name] = module[name]
        }
    },
    /*
        init will initialize the Core. This means injecting the dependencies
            into modules based on the dependency mapping. 

        @param {Function} [callback] - optional callback to be invoked when
            all modules are done injecting dependencies
    */
    init: function init(callback) {
        var that = this,
            counter = 1

        Object.keys(that._interfaces).forEach(injectDeps)
        Object.keys(that._interfaces).forEach(setupModules)
        next()

        function injectDeps(name) {
            var module = that._modules[name],
                deps = {}

            if (that.dependencies[name]) {
                Object.keys(that.dependencies[name]).forEach(mapToInterface)
            }
            pd.extend(module, deps);

            function mapToInterface(key) {
                var dependency = that.dependencies[name][key]
                if (typeof dependency === "string") {
                    deps[key] = that.interfaces[dependency]   
                } else if (Array.isArray(dependency)) {
                    deps[key] = dependency.map(returnInterface)
                } else if (typeof dependency === "object") {
                    deps[key] = {}
                    Object.keys(dependency).forEach(setDependency)
                }
                
                function returnInterface(dependency) {
                    return that.interfaces[dependency]
                }

                function setDependency(name) {
                    deps[key][name] = that.interfaces[dependency[name]]
                }
            }
        }

        function setupModules(name) {
            var module = that._modules[name]

            if (module.setup) {
                if (module.setup.length === 1) {
                    counter++
                }
                module.setup(next)
            }
        }

        function next() {
            if (--counter === 0) {
                callback && callback()
                Object.keys(that._modules).forEach(invokeInit)
            }
        }

        function invokeInit(name) {
            var module = that._modules[name]
            module.init && module.init()
        }
    },
    /*
        remove, removes the module from the Core. It will also invoke the 
            module's destroy method, allowing the module to do clean up logic.  

        @param {String} name - The module to remove
    */
    remove: function remove(name) {
        var that = this,
            module = that._modules[name]

        delete that.interfaces[name]
        delete that._interfaces[name]
        delete that._modules[name]

        module.destroy && module.destroy()
    },
    /*
        purge just removes all modules from the Core. basically resetting the
            core to a clean state.
    */
    purge: function purge() {
        Object.keys(this.interfaces).forEach(callRemove, this)
        
        function callRemove(name) {
            this.remove(name)
        }
    },
    /*
        makeProxy takes an interface and a module and stores a proxy of the 
            interface as the public interface under Core.interfaces

        @param {String} name - name of module

        @param {Object} interface - internal interface object

        @param {Object} module - module object of module
    */
    _makeProxy: function _makeProxy(name, _interface, module) {
        var proxy = {},
            that = this

        Object.keys(_interface).forEach(proxyProperty)
        that._interfaces[name] = _interface
        that._modules[name] = module
        that.interfaces[name] = proxy

        function proxyProperty(name) {
            var value = _interface[name]
            if (typeof value === "function") {
                _interface[name] = value.bind(module)
                proxy[name] = proxyFunction(name)
            } else {
                proxy[name] = value
            }
        }

        function proxyFunction(functionName) {
            return proxy

            function proxy() {
                return that._interfaces[name][functionName]
                    .apply(this, arguments)
            }
        }
    }
}
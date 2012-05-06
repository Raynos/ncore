var pd = require("pd"),
    bindAll = pd.bindAll,
    extend = pd.extend,
    EventEmitter = require("events").EventEmitter.prototype

module.exports = {
    /*
        Construct a new core instance. Supply the original dependencies hash
            to set up the dependency mapping for the core

        @param {Object} dependencies - This is a map of dependencies
    */
    constructor: function (dependencies) {
        this.proxies = {}
        this._modules = {}
        this._interfaces = {}
        this.dependencies = dependencies || {}
        return this
    },
    /*
        Store a module in the core. 

        @param {String} name - name of module, used in dependency mapping

        @param {Object} module - the implementation of the module

        @return {Object} proxy - the public proxy of the module
    */
    add: function (name, module) {
        var _interface = makeInterface(this, name, module),
            proxy = makeProxy(this, name, _interface)

        extend(module, {
            emit: proxy.emit
        })

        this._modules[name] = module
        this._interfaces[name] = _interface
        this.proxies[name] = proxy

        return proxy
    },
    /*
        initializes all modules, it does so by injecting dependencies and
            then calling setup on all modules

        @param {Function} [callback] - optional callback to be invoked when
            all modules finish setup.
    */
    init: function (callback) {
        injectDependencies(this)
        setupModules(this, callback)
    }
}

function makeInterface(core, name, module) {
    var _interface
    if (typeof module === "function") {
        _interface = proxyModule
    } else {
        _interface = {}
    }
    bindAll(module)
    if (module.expose) {
        module.expose.forEach(addToInterface)
    } else {
        extend(_interface, module)
    }
    return _interface

    function proxyModule() {
        return module.apply(this, arguments)
    }

    function addToInterface(name) {
        _interface[name] = module[name]
    }
}

function makeProxy(core, name, _interface) {
    var interfaces = core._interfaces,
        proxy

    if (typeof _interface === "function") {
        proxy = bindAll(proxyForFunction, EventEmitter)
    } else {
        proxy = bindAll({}, EventEmitter)
    }

    Object.keys(_interface).forEach(proxyProperty)

    return proxy

    function proxyForFunction() {
        return interfaces[name].apply(this, arguments)
    }

    function proxyProperty(key) {
        if (typeof _interface[key] === "function") {
            proxy[key] = proxyFunction(key)
        }
    }

    function proxyFunction(functionName) {
        return proxy

        function proxy() {
            return interfaces[name][functionName].apply(null, arguments)
        }
    }
}

function injectDependencies(core) {
    var modules = core._modules,
        coreDependencies = core.dependencies,
        proxies = core.proxies

    Object.keys(modules).forEach(injectDependencies)

    function injectDependencies(name) {
        var module = modules[name],
            dependencies = coreDependencies[name],
            deps = {}

        if (dependencies) {
            Object.keys(dependencies).forEach(mapToProxy)
        }
        extend(module, deps)

        function mapToProxy(key) {
            var dependency = dependencies[key]

            if (typeof dependency === "string") {
                deps[key] = proxies[dependency]
            } else if (Array.isArray(dependency)) {
                deps[key] = dependency.map(returnProxy)
            } else if (typeof dependency === "object") {
                deps[key] = {}
                Object.keys(dependency).forEach(setProxyFromDependency)
            }

            function setProxyFromDependency(dependencyKey) {
                deps[key][dependencyKey] = proxies[dependency[dependencyKey]]
            }
        }
    }

    function returnProxy(name) {
        return proxies[name]
    }
}

function setupModules(core, callback) {
    var modules = core._modules,
        counter = 1

    Object.keys(modules).forEach(setupModules)
    next()

    function setupModules(name) {
        var module = modules[name]

        if (typeof module.setup === "function") {
            if (module.setup.length >= 1) {
                counter++
            }
            module.setup(next)
        }
    }

    function next() {
        if (--counter === 0) {
            callback && callback()
            Object.keys(modules).forEach(invokeInit)
        }
    }

    function invokeInit(name) {
        var module = modules[name]
        module.init && module.init()
    }
}
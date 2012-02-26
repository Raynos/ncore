var EventEmitter = require("eventemitter-light"),
    pd = require("pd");

module.exports = {
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
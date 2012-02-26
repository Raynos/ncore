var EventEmitter = require("eventemitter-light"),
    pd = require("pd");

module.exports = {
    constructor: function constructor(dependencies, ee) {
        var that = this;
        that.interfaces  = {};
        that.ee = ee || EventEmitter;
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
        var interface = Object.create(this.ee);
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
    init: function init() {
        Object.keys(this._interfaces).forEach(invokeInject, this);

        function invokeInject(name) {
            var module = this._modules[name];
            if (module.inject) {
                var deps = {};
                if (this.dependencies[name]) {
                    Object.keys(this.dependencies[name]).forEach(
                        mapToInterface, this);    
                }
                module.inject(deps);
            }


            function mapToInterface(key) {
                var dependency = this.dependencies[name][key];
                deps[key] = this.interfaces[dependency];
            }
        }
    },
    module: function module() {
        
    },
    remove: function remove(name) {
        var that = this;
        delete that.interfaces[name];
        delete that._interfaces[name];
        delete that._modules[name];
    },
    purge: function purge() {
        var that = this;
        that.interfaces = {};
        that._interfaces = {};
        that._modules = {};
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
                return that._interfaces[name][functionName].apply(this, arguments);
            }
        }
    }
};
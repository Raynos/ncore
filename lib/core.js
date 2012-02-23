var EventEmitter = require("eventemitter-light");

module.exports = {
    constructor: function constructor(ee) {
        var that = this;
        that.interfaces  = {};
        that.ee = ee || EventEmitter;
        that._modules = {};
        return that;
    },
    use: function use(name, module) {
        var interface = Object.create(this.ee);
        module.attach && module.attach(interface);
        this._makeProxy(name, interface, module);
    },
    init: function init() {
        
    },
    module: function module() {
        
    },
    remove: function remove(name) {
        delete this.interfaces[name];
    },
    purge: function purge() {
        
    },
    _makeProxy: function _makeProxy(name, interface, module) {
        var proxy = {},
            that = this;

        Object.keys(interface).forEach(proxyProperty);
        that._modules[name] = interface;
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
                return that._modules[name][functionName].apply(this, arguments);
            }
        }
    }
};
var EventEmitter = require("eventemitter-light");

module.exports = {
    constructor: function constructor(ee) {
        this.interfaces  = {};
        this.ee = ee || EventEmitter;
        return this;
    },
    use: function use(name, module) {
        var interface = Object.create(this.ee);
        module.attach && module.attach(interface);
        this.interfaces[name] = interface;
    },
    init: function init() {
        
    },
    module: function module() {
        
    },
    remove: function remove(name) {
        delete this.interfaces[name];
    },
    purge: function purge() {
        
    }
};
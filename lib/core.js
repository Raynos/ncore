var pd = require('pd'),
	EventEmitter = require('eventemitter-light'),
	slice = [].slice.call.bind([].slice);

var Core = {
	use: multipleAPIs(function use(name, module) {
		this.modules[name] = module;
		module.attach && module.attach(this);
	}),
	remove: multipleAPIs(function remove(name) {
		var modules = this.modules,
			module = modules[name];
		module.detach && module.detach(this);
		delete modules[name];
	}),
	init: function init(callback) {
		var modules = this.modules,
			counter = 1,
			keys = Object.keys(modules);
			
		keys.forEach(invokeInit);
		callbackProxy();

		function invokeInit(key) {
			var module = modules[key];

			if (!module.init) return;

			if (module.init.length === 1) {
				counter++;
			}

			module.init(callbackProxy);
		}

		function callbackProxy() {
			--counter === 0 && callback && callback(); 
		}
	},
	constructor: function constructor(eventEmitter) {
		eventEmitter = eventEmitter || EventEmitter;
		pd.extend(this, eventEmitter, { constructor: constructor });
		eventEmitter.constructor.apply(this, slice(arguments, 1));
		this.modules = {};
		// support method and invoke
		this.method = this.on;
		this.invoke = this.emit;
		return this;
	}	
};

var Modules = {
	module: multipleAPIs(function module(name, module) {
		module = pd.bindAll(module);
		module.mediator = this;
		this.use(name, module);
		module.destroy && this.on("destroy", module.destroy);
	}),
	purge: function purge() {
		Object.keys(this.modules).forEach(removeModule, this);
		this._events = {};
	}
};

module.exports = pd.extend(Core, Modules);

function removeModule(name) {
	this.remove(name);
}

function multipleAPIs(cb) {
	return proxy;

	function proxy(name) {
		if (typeof name !== "string") {
			return Object.keys(name).forEach(invokeCallback, this);
		}
		cb.apply(this, arguments);

		function invokeCallback(key) {
			cb.call(this, key, name[key]);
		}
	}
}

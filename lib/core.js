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
	constructor: function constructor(eventEmitter) {
		eventEmitter = eventEmitter || EventEmitter;
		pd.extend(this, eventEmitter, { constructor: constructor });
		eventEmitter.constructor.apply(this, slice(arguments, 1));
		this.modules = {};
		this._methods = {};
		return this;
	}	
};

var Methods = {
	method: function method(name, method) {
		this._methods[name] = method;
	},
	invoke: function invoke(name) {
		var args = slice(arguments, 1);
		this._methods[name].apply(this, args);
	}
};

var Modules = {
	module: multipleAPIs(function module(name, module) {
		module = pd.bindAll(module);
		module.mediator = this;
		this.use(name, module);
		module.init && this.on("init", module.init);
		module.destroy && this.on("destroy", module.destroy);
	}),
	purge: function purge() {
		Object.keys(this.modules).forEach(removeModule, this);
		this._events = {};
	},	
};

module.exports = pd.extend(Methods, Modules, Core);

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

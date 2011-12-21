!function _anonymousWrapper(require, exports) {
	"use strict";

	var pd = require("pd"),
		events = require("EventEmitter2"),
		EventEmitter2 = events.EventEmitter2 || events,
		after = require("after");

	var nCore = pd.make(EventEmitter2.prototype, {
		use: use,
		remove: remove,
		destroy: destroy,
		init: init,
		constructor: constructor,
		_meta: pd.Name()
	});

	exports.nCore = nCore;

    /*
    	Attach a module to the core.

    	Calls the attach method of the module

    	@param String name - name of module
    	@param Object module - module to attach
		@param [optional] Object data - data passed to module
		@param [optional] Function callback - callback invoked 
			if this module needs to be initialized
    */
	function use(name, module, data, callback) {
		if (typeof name !== "string") {
			if (name.name) {
				callback = data;
				data = module;
				module = name;
				name = module.name;
			} else {
				callback = data;
				data = module;
				return Object.keys(name).forEach(
					invokeUseOnModules, this);
			}
		}

		if (typeof data === "function" && callback === undefined) {
			callback = data;
			data = null;
		}

		if (data === undefined || data === null) {
			data = this;
		}

		if (!this._modules) {
			this._modules = {};
		} 

		this._modules[name] = module;

		module.attach && module.attach.call(this, data, this);

		if (this._initialized) {
			module.init && 
				module.init.call(this, callback || noop, this);
		}

		function invokeUseOnModules(key) {
			var module = name[key];
			this.use(key, module, data, callback);
		}
	}

	/*
		Initializes all modules attached to the core

		Calls the init method of all modules

		@param [optional] Any options - ignored, 
			there for backwards support with broadway
		@param Function callback - callback function
			to be invoked when all modules have initialized.
		
	*/
	function init(options, callback) {
		if (typeof options === "function" && callback === undefined) {
			callback = options;
			options = null;
		}

		this._initialized = true;

		if (!this._modules) return;

		var keys = Object.keys(this._modules);

		var next = after(keys.length, callback);

		keys.forEach(invokeInit, this);

		function invokeInit(name) {
			var module = this._modules[name];
			if (module.init) {
				module.init.call(this, next, this);
			} else {
				next();
			}
			this._meta(module).initialized = true;
		}
	}

	/*
		Removes a module from the core. 

		Invokes the modules detach method

		@param String name - name of module to be removed
		@param [optional] Function callback - callback to be 
			invoked if the module to be removed 
			also needs to be destroyed
	*/
	function remove(name, callback) {
		if (typeof name !== "string") {
			if (name.name) {
				name = name.name;
			} else {
				return Object.keys(name).forEach(
					invokeRemoveOnModules, this);
			}
		}
		
		var module = this._modules[name];

		if (this._meta(module).initialized) {
			if (module.destroy) {
				module.destroy.call(this, callback || noop, this);
			} else {
				callback && callback();
			}
		}
		module.detach && module.detach.call(this, this);

		delete this._modules[name];

		function invokeRemoveOnModules(key) {
			this.remove(key)
		}
	}

	/*
		destroys and detaches all attached modules

		@param [optional] Function callback - callback to be
			invoked when all modules are destroyed
	*/
	function destroy(callback) {
		var keys = Object.keys(this._modules);

		var next = after(keys.length, afterDestroy.bind(this));

		keys.forEach(invokeDestroyOnModules, this);

		function invokeDestroyOnModules(name) {
			var module = this._modules[name];

			if (module.destroy) {
				module.destroy.call(this, next, this);
			} else {
				next();
			}
		}

		function afterDestroy() {
			keys.forEach(invokeDetachOnModules, this);

			callback();
		}

		function invokeDetachOnModules(name) {
			var module = this._modules[name];

			module.detach && module.detach.call(this, this);
		}
	}

	/*
		Constructor initializes the value of _meta to a new Name.
	*/
	function constructor() {
		this._meta = pd.Name();

		return this;
	}

	function noop() {
		
	}

}(
	function _require(name) {
		return require ? require(name) : window[name];
	},
	typeof window !== "undefined" ? window : exports
);
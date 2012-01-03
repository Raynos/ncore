!function _anonymousWrapper(require, exports, undefined) {
	"use strict";

	var pd = require("pd"),
		events = require("eventemitter2"),
		EventEmitter2 = events.EventEmitter2 || events,
		after = require("after");

	var nCore = pd.make(EventEmitter2.prototype, {
		use: use,
		remove: remove,
		destroy: destroy,
		init: init,
		module: module,
		constructor: constructor,
		_meta: pd.Name()
	});

	exports.nCore = nCore;

	/*
		Attach a module to the core.
		
		Calls the attach method of the module
		
		@param String name - name of module
		@param Object module - module to attach
	*/
	function use(name, module) {
		if (module === undefined) {
			return Object.keys(name).forEach(invokeUseOnModules, this);
		}

		if (!this._modules) {
			this._modules = {};
		} 

		this._modules[name] = module;

		module.attach && module.attach(this);

		if (this._initialized) {
			module.init && module.init(this);
		}

		function invokeUseOnModules(key) {
			this.use(key, name[key]);
		}
	}
	
	/*
	    Create a module and attach it the core.
	
	    A module will have bindAll called on it and will have the mediator set as
	    a property of the module
	
	    @param String name - name of module
	    @param Object module - module to attach
	*/
	function module(name, module) {
		if (module === undefined) {
			return Object.keys(name).forEach(invokeModuleOnModule, this);
		}
		
		module = pd.bindAll(module);
		module.mediator = this;
		this.use(name, module);
		
		function invokeModuleOnModule(key) {
			this.use(key, name[key]);
		}
	}

	/*
		Initializes all modules attached to the core

		Calls the init method of all modules		
	*/
	function init() {
		this._initialized = true;

		if (!this._modules) return;

		Object.keys(this._modules).forEach(invokeInit, this);

		function invokeInit(name) {
			var module = this._modules[name];
			module.init && module.init(this);
			this._meta(module).initialized = true;
		}
	}

	/*
		Removes a module from the core. 

		Invokes the modules detach method

		@param String name - name of module to be removed
	*/
	function remove(name) {
		if (name !== "string") {
			return Object.keys(name).forEach(invokeRemoveOnModules, this);
		}
		
		var module = this._modules[name];

		if (this._meta(module).initialized) {
			module.destroy && module.destroy(this);
		}
		
		module.detach && module.detach(this);

		delete this._modules[name];

		function invokeRemoveOnModules(key) {
			this.remove(key)
		}
	}

	/*
		destroys and detaches all attached modules
	*/
	function destroy() {
		var keys = Object.keys(this._modules)
		
		keys.forEach(invokeDestroyOnModules, this);
		keys.forEach(invokeDetachOnModules, this);

		function invokeDestroyOnModules(name) {
			var module = this._modules[name];

			module.destroy && module.destroy(this);
		}

		function invokeDetachOnModules(name) {
			var module = this._modules[name];

			module.detach && module.detach(this);
		}
	}

	/*
		Constructor initializes the value of _meta to a new Name.
	*/
	function constructor() {
		this._meta = pd.Name();

		return this;
	}
}(
	function _require(name) {
		return typeof require !== 'undefined' ? require(name) : window[name];
	},
	typeof window !== "undefined" ? window : exports
);
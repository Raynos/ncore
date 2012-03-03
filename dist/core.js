// This file was generated by modules-webmake (modules for web) project
// see: https://github.com/medikoo/modules-webmake

(function (modules) {
	var getModule, getRequire, require;
	getModule = (function (wrap) {
		return function (scope, tree, path, fullpath) {
			var name, dir, exports = {}, module = { exports: exports }, fn;
			path = path.split('/');
			name = path.pop();
			if (!name) {
				name = path.pop();
			}
			while ((dir = path.shift())) {
				if (dir === '..') {
					scope = tree.pop();
				} else if (dir !== '.') {
					tree.push(scope);
					scope = scope[dir];
				}
			}
			if (scope[name + '.js']) {
				name += '.js';
			}
			if (typeof scope[name] === 'object') {
				tree.push(scope);
				scope = scope[name];
				name = 'index.js';
			}
			fn = scope[name];
			if (!fn) {
				throw new Error("Could not find module '" + fullpath + "'");
			}
			scope[name] = wrap(module);
			fn.call(exports, exports, module, getRequire(scope, tree));
			return module.exports;
		};
	}(function (cmodule) {
		return function (ignore, module) {
			module.exports = cmodule.exports;
		};
	}));
	require = function (scope, tree, fullpath) {
		var name, path = fullpath, t = fullpath.charAt(0);
		if (t === '/') {
			path = path.slice(1);
			scope = modules['/'];
			tree = [];
		} else if (t !== '.') {
			name = path.split('/', 1)[0];
			scope = modules[name];
			tree = [];
			path = path.slice(name.length + 1) || scope[':mainpath:'];
		}
		return getModule(scope, tree, path, fullpath);
	};
	getRequire = function (scope, tree) {
		return function (path) {
			return require(scope, [].concat(tree), path);
		};
	};
	return getRequire(modules, []);
})
({
	"eventemitter-light": {
		":mainpath:": "lib/ee",
		"lib": {
			"ee.js": function (exports, module, require) {
				module.exports = {
				    on: function on(ev, handler) {
				        var events = this._events;

				        (events[ev] || (events[ev] = [])).push(handler);
				    },
				    removeListener: function removeListener(ev, handler) {
				        var array = this._events[ev];

				        array && array.splice(array.indexOf(handler), 1);
				    },
				    emit: function emit(ev) {
				        var args = [].slice.call(arguments, 1),
				            array = this._events[ev] || [];

				        for (var i = 0, len = array.length; i < len; i++) {
				            array[i].apply(this, args);
				        }
				    },
				    once: function once(ev, handler) {
				        this.on(ev, proxy);

				        function proxy() {
				            handler.apply(this, arguments);
				            this.removeListener(ev, handler);
				        }
				    },
				    constructor: function constructor() {
				        this._events = {};
				        return this;
				    }
				};
			}
		}
	},
	"nCore": {
		"lib": {
			"browser.js": function (exports, module, require) {
				window.nCore = require("./core")
			},
			"core.js": function (exports, module, require) {
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
				                }
				                
				                function returnInterface(dependency) {
				                    return that.interfaces[dependency]
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
			}
		}
	},
	"pd": {
		":mainpath:": "lib/pd",
		"lib": {
			"pd.js": function (exports, module, require) {
				/*
				    pd(obj) -> propertyDescriptorsOfObject {
				        bindAll: function that binds all the methods of an object to the object,
				        extend: function that extends the first argument with the rest
				        Name: returns a namespace(anyKey) -> uniqueObject function
				    }
				    
				    pd requires ES5. Uses the shimmable subset of ES5.
				*/
				;(function (Object, slice) {
				    "use strict"
				    
				    pd.bindAll = bindAll
				    pd.extend = extend
				    pd.Name = Name
				    
				    typeof module !== "undefined" ? module.exports = pd : window.pd = pd

				    /*
				        pd will return all the own propertydescriptors of the object

				        @param Object object - object to get pds from.

				        @return Object - A hash of key/propertyDescriptors
				    */    
				    function pd(obj) {
				        var pds = {}
				        Object.getOwnPropertyNames(obj).forEach(function(key) {
				            pds[key] = Object.getOwnPropertyDescriptor(obj, key)
				        })
				        return pds
				    }

				    /*
				        Extend will extend the firat parameter with any other parameters 
				        passed in. Only the own property names will be extended into
				        the object

				        @param Object target - target to be extended
				        @arguments Array [target, ...] - the rest of the objects passed
				            in will extended into the target

				        @return Object - the target
				    */
				    function extend(target) {
				        slice.call(arguments, 1).forEach(function(source) {
				            Object.defineProperties(target, pd(source))
				        });
				        return target
				    }

				    /*
				        defines a namespace object. This hides a "privates" object on object 
				        under the "key" namespace

				        @param Object object - object to hide a privates object on
				        @param Object key - key to hide it under

				        @author Gozala : https://gist.github.com/1269991

				        @return Object privates
				    */
				    function namespace(object, key) {
				        var privates = Object.create(object),
				            valueOf = object.valueOf
				        
				        Object.defineProperty(object, "valueOf", {
				            value: function(value) {
				                return value !== key ? valueOf.apply(this, arguments) : privates
				            },
				            writable: true,
				            configurable: true
				        })
				        
				        return privates
				    }
				    
				    /*
				        Constructs a Name function, when given an object it will return a
				        privates object. 

				        @author Gozala : https://gist.github.com/1269991

				        @return Function name
				    */
				    function Name() {
				        var key = {}
				        return name
				        
				        function name(object) {
				            var privates = object.valueOf(key)
				            return privates !== object ? privates : namespace(object, key)
				        }
				    }
				    
				    /*
				        bindAll binds all methods to have their context set to the object

				        @param Object obj - the object to bind methods on
				        @arguments Array [target, ...] - the rest of the objects passed
				            in will extended into the obj

				        @return Object - the bound object
				    */
				    function bindAll(obj) {
				        pd.extend.apply(null, arguments) 
				        Object.keys(obj).filter(isMethod).forEach(bindMethods)
				        return obj
				        
				        function isMethod(name) {
				            return obj[name] && obj[name].bind === isMethod.bind
				        }
				        
				        function bindMethods(name) {
				            obj[name] = obj[name].bind(obj)
				        }
				    }

				})(Object, [].slice)
			}
		}
	}
})
("nCore/lib/browser");

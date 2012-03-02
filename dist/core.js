var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/core.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/node_modules/eventemitter-light/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"lib/ee"}
});

require.define("/node_modules/eventemitter-light/lib/ee.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/node_modules/pd/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"lib/pd"}
});

require.define("/node_modules/pd/lib/pd.js", function (require, module, exports, __dirname, __filename) {
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
});

require.define("/browser.js", function (require, module, exports, __dirname, __filename) {
    window.nCore = require("./core")
});
require("/browser.js");

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
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
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

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("/node_modules/ncore/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"lib/core\"}\n//@ sourceURL=/node_modules/ncore/package.json"
));

require.define("/node_modules/ncore/lib/core.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var pd = require(\"pd\"),\n    bindAll = pd.bindAll,\n    extend = pd.extend,\n    EventEmitter = require(\"events\").EventEmitter.prototype\n\nmodule.exports = {\n    /*\n        Construct a new core instance. Supply the original dependencies hash\n            to set up the dependency mapping for the core\n\n        @param {Object} dependencies - This is a map of dependencies\n    */\n    constructor: function (dependencies) {\n        this.proxies = {}\n        this._modules = {}\n        this._interfaces = {}\n        this.dependencies = dependencies || {}\n        return this\n    },\n    /*\n        Store a module in the core. \n\n        @param {String} name - name of module, used in dependency mapping\n\n        @param {Object} module - the implementation of the module\n\n        @return {Object} proxy - the public proxy of the module\n    */\n    add: function (name, module) {\n        var _interface = makeInterface(this, name, module),\n            proxy = makeProxy(this, name, _interface)\n\n        extend(module, {\n            emit: proxy.emit\n        })\n\n        this._modules[name] = module\n        this._interfaces[name] = _interface\n        this.proxies[name] = proxy\n\n        return proxy\n    },\n    /*\n        initializes all modules, it does so by injecting dependencies and\n            then calling setup on all modules\n\n        @param {Function} [callback] - optional callback to be invoked when\n            all modules finish setup.\n    */\n    init: function (callback) {\n        var self = this,\n            modules = self._modules,\n            counter = 1\n\n        injectDependencies(this)\n        setupModules(this, callback)\n    }\n}\n\nfunction makeInterface(core, name, module) {\n    var _interface = {}\n    bindAll(module)\n    if (module.expose) {\n        module.expose.forEach(addToInterface)\n    } else {\n        extend(_interface, module)\n    }\n    return _interface\n\n    function addToInterface(name) {\n        _interface[name] = module[name]\n    }\n}\n\nfunction makeProxy(core, name, _interface) {\n    var proxy = bindAll({}, EventEmitter),\n        interfaces = core._interfaces\n\n    Object.keys(_interface).forEach(proxyProperty)\n\n    return proxy\n\n    function proxyProperty(key) {\n        if (typeof _interface[key] === \"function\") {\n            proxy[key] = proxyFunction(key)\n        }\n    }\n\n    function proxyFunction(functionName) {\n        return proxy\n\n        function proxy() {\n            return interfaces[name][functionName].apply(null, arguments)\n        }\n    }\n}\n\nfunction injectDependencies(core) {\n    var modules = core._modules,\n        coreDependencies = core.dependencies,\n        proxies = core.proxies\n\n    Object.keys(modules).forEach(injectDependencies)\n\n    function injectDependencies(name) {\n        var module = modules[name],\n            dependencies = coreDependencies[name],\n            deps = {}\n\n        if (dependencies) {\n            Object.keys(dependencies).forEach(mapToProxy)\n        }\n        extend(module, deps)\n\n        function mapToProxy(key) {\n            var dependency = dependencies[key]\n\n            if (typeof dependency === \"string\") {\n                deps[key] = proxies[dependency]\n            } else if (Array.isArray(dependency)) {\n                deps[key] = dependency.map(returnProxy)\n            } else if (typeof dependency === \"object\") {\n                deps[key] = {}\n                Object.keys(dependency).forEach(setProxyFromDependency)\n            }\n\n            function setProxyFromDependency(dependencyKey) {\n                deps[key][dependencyKey] = proxies[dependency[dependencyKey]]\n            }\n        }\n    }\n\n    function returnProxy(name) {\n        return proxies[name]\n    }\n}\n\nfunction setupModules(core, callback) {\n    var modules = core._modules,\n        counter = 1\n\n    Object.keys(modules).forEach(setupModules)\n    next()\n\n    function setupModules(name) {\n        var module = modules[name]\n\n        if (typeof module.setup === \"function\") {\n            if (module.setup.length >= 1) {\n                counter++\n            }\n            module.setup(next)\n        }\n    }\n\n    function next() {\n        if (--counter === 0) {\n            callback && callback()\n            Object.keys(modules).forEach(invokeInit)\n        }\n    }\n\n    function invokeInit(name) {\n        var module = modules[name]\n        module.init && module.init()\n    }\n}\n//@ sourceURL=/node_modules/ncore/lib/core.js"
));

require.define("/node_modules/pd/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"lib/pd\"}\n//@ sourceURL=/node_modules/pd/package.json"
));

require.define("/node_modules/pd/lib/pd.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var slice = Array.prototype.slice\n\n/*\n    pd {\n        bindAll: function that binds all the methods of an object to the object\n        extend: function that extends the first argument with the rest\n        Name: returns a namespace(anyKey) -> uniqueObject function\n        memoize: returns a memoized version of the function\n    }\n*/\nmodule.exports = {\n    bindAll: bindAll,\n    extend: extend,\n    Name: Name,\n    memoize: asyncMemoize\n}\n\n/*\n    Extend will extend the first parameter with any other parameters \n    passed in. Only the own property names will be extended into\n    the object\n\n    @param Object target - target to be extended\n    @arguments Array [target, ...] - the rest of the objects passed\n        in will extended into the target\n\n    @return Object - the target\n*/\nfunction extend(target) {\n    slice.call(arguments, 1).forEach(function(source) {\n        Object.getOwnPropertyNames(source).forEach(function (name) {\n            target[name] = source[name]\n        })\n    })\n    return target\n}\n\n/*\n    defines a namespace object. This hides a \"privates\" object on object \n    under the \"key\" namespace\n\n    @param Object object - object to hide a privates object on\n    @param Object key - key to hide it under\n\n    @author Gozala : https://gist.github.com/1269991\n\n    @return Object privates\n*/\nfunction namespace(object, key) {\n    var privates = Object.create(object),\n        valueOf = object.valueOf\n    \n    Object.defineProperty(object, \"valueOf\", {\n        value: function(value) {\n            return value !== key ? valueOf.apply(this, arguments) : privates\n        },\n        writable: true,\n        configurable: true\n    })\n    \n    return privates\n}\n\n/*\n    Constructs a Name function, when given an object it will return a\n    privates object. \n\n    @author Gozala : https://gist.github.com/1269991\n\n    @return Function name\n*/\nfunction Name() {\n    var key = {}\n    return name\n    \n    function name(object) {\n        var privates = object.valueOf(key)\n        return privates !== object ? privates : namespace(object, key)\n    }\n}\n\n/*\n    bindAll binds all methods to have their context set to the object\n\n    @param Object obj - the object to bind methods on\n    @arguments Array [target, ...] - the rest of the objects passed\n        in will extended into the obj\n\n    @return Object - the bound object\n*/\nfunction bindAll(obj) {\n    extend.apply(null, arguments) \n    Object.keys(obj).filter(isMethod).forEach(bindMethods)\n    return obj\n    \n    function isMethod(name) {\n        return obj[name] && obj[name].bind === isMethod.bind\n    }\n    \n    function bindMethods(name) {\n        obj[name] = obj[name].bind(obj)\n    }\n}\n\n/*\n    default hasher for memoize. Takes the first arguments and returns it\n        if it's a string, otherwise returns the string \"void\"\n\n    @param Any x - argument to hash on\n\n    @return String - a hash key\n*/\nfunction defaultHasher(x) { \n    if (typeof x === \"object\" || typeof x === \"function\" ||\n            typeof x === \"undefined\"\n    ) {\n        return \"void\"\n    }\n    return x.toString()\n}\n\n/*\n    memoizes asynchronous functions. The asynchronous function must have\n        a callback as a last argument, and that callback must be called.\n    \n    Memoization means that the function you pass in will only be called once\n        for every different type of argument. If the async function only\n        has a callback argument then it will only be called once. The \n        results of invocation are cached\n\n    @param Function fn - function to memoize\n    @param Object context - optional context for the function\n    @param Function hasher - optional custom hasher function. This will\n        be called on the arguments of the memoized function. The result\n        of the hasher will be the key the cached data will be stored under.\n\n    @return Function - the memoized function\n*/\nfunction asyncMemoize(fn, context, hasher) {\n    var caches = callProxy.cache = {},\n        callbackLists = {}\n\n    if (typeof context === \"function\") {\n        hasher = context\n        context = null\n    }\n\n    if (typeof hasher === \"undefined\") {\n        hasher = defaultHasher\n    }\n\n    return callProxy\n\n    function callProxy() {\n        var args = [].slice.call(arguments),\n            cb = args.pop(),\n            key = hasher.apply(null, args)\n\n        if (caches[key]) {\n            return typeof cb === \"function\" && cb.apply(null, caches[key])\n        } else if (callbackLists[key]) {\n            return callbackLists[key].push(cb)\n        }\n\n        callbackLists[key] = [cb]\n\n        args.push(callbackProxy)\n\n        fn.apply(context, args)\n\n        function callbackProxy() {\n            caches[key] = arguments\n            var list = callbackLists[key]\n            delete callbackLists[key]\n            // it might undefined >_< if the callback is blocking\n            list && list.forEach(function (cb) {\n                typeof cb === \"function\" && cb.apply(this, caches[key])\n            }, this)\n        }\n    }\n}\n//@ sourceURL=/node_modules/pd/lib/pd.js"
));

require.define("events", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = list.indexOf(listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("/foo.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n    init: function () {\n        typeof window !== \"undefined\" && (window[\"bar.bar\"] = this.bar)\n        typeof window !== \"undefined\" && (window[\"bar.foo\"] = this.foo)\n        typeof window !== \"undefined\" && (window[\"baz\"] = this.baz)\n    },\n    has: function (name) {\n        return this[name];\n    },\n    expose: [\"has\"]\n};\n//@ sourceURL=/foo.js"
));

require.define("/bar/bar.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n    setup: function () {\n        typeof window !== \"undefined\" && (window[\"foo\"] = this.foo)\n    },\n    has: function (name) {\n        return this[name]\n    },\n    expose: [\"has\"]\n};\n//@ sourceURL=/bar/bar.js"
));

require.define("/bar/foo.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n    setup: function() {\n        typeof window !== \"undefined\" && (window[\"bar.foo\"] = this)\n    },\n    has: function (name) {\n        return this[name]\n    },\n    expose: [\"has\"]\n};\n//@ sourceURL=/bar/foo.js"
));

require.define("/baz.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n    has: function (name) {\n        return this[name];\n    }\n};\n//@ sourceURL=/baz.js"
));

require.define("/dummy.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "(function () { \nvar ncore = require('ncore')\nvar Core = Object.create(ncore).constructor()\nCore.add('foo', require('./foo.js')) \nCore.add('bar.bar', require('./bar/bar.js')) \nCore.add('bar.foo', require('./bar/foo.js')) \nCore.add('baz', require('./baz.js')) \nCore.dependencies = {\"foo\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\",\"baz\":\"baz\"},\"bar.bar\":{\"foo\":\"foo\",\"foobar\":\"bar.bar\",\"bars\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\"}},\"bar.foo\":{\"foo\":\"foo\",\"foobar\":\"bar.foo\",\"bars\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\"}}}\nCore.init()\n})()\n//@ sourceURL=/dummy.js"
));
require("/dummy.js");

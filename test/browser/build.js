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

require.define("path", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("/core.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "\"use strict\"\n\nvar EventEmitter = require(\"eventemitter-light\"),\n    pd = require(\"pd\");\n\n/*\n    Modules have four phases. The first two are handled for you\n\n    The definition phase:\n\n        When a module is used on the core, the core will inspect the module\n            by reading it's expose property. It then copies the methods in the\n            expose array out of the array and calls it the interface of the \n            module\n\n        At this the interface is wrapped in a proxy that invokes it indirectly.\n            this proxy is the public interface, this indirection is added to\n            support hot reloading of interfaces\n\n    Someone calls Core.init() and then the following three phases occur\n\n    The injection phase:\n\n        When the core is initialized all the dependencies are injected into\n            all the modules. This injection is based on the dependency mapping\n            passed into the core when it's constructed\n\n        Injection basically means mixing in the dependencies into the module\n\n    The setup phase:\n\n        The setup phase happens after dependencies are injected for all the\n            modules. In this phase the core calls the setup method of\n            the modules with an optional done callback\n\n        This allows modules to do asynchronous setup logic and tell the Core\n            \"hey I'm ready to go now\"\n\n    The init phase:\n\n        After all the modules are ready the init method is invoked on \n            modules that have it.\n\n        The init method is used to start your application, i.e. create your \n            HTTP server or start your cron jobs, etc.\n\n    Note that inside the interfaces methods the thisContext value is the module\n        itself.\n*/\nmodule.exports = {\n    /*\n        Construct a Core with dependencies and an optional EventEmitter \n            prototype. \n\n        The dependencies contain the dependency mapping setup for\n            modules, so the core knows what dependencies to inject into what\n            modules. \n\n        The eventemitter prototype is used to choose the eventEmitter \n            implementation that interfaces have.\n\n        @param {Object} dependencies - This is a map of dependencies.\n            {\n                <ModuleName>: {\n                    <PropertyName>: <OtherModuleName>\n                }\n            }\n\n            This means that <ModuleName> will have a deps object injected with\n                a property <PropertyName> which contains the public interface\n                of <OtherModuleName>\n\n        @param {Object} [ee] - An optional EventEmitter prototype. Used if you \n            want the interface to inherit from a different EventEmitter then\n            eventemitter-light\n    */\n    constructor: function constructor(dependencies, ee) {\n        var that = this;\n        that.interfaces  = {};\n        that._ee = ee || EventEmitter;\n        that._modules = {};\n        that._interfaces = {};\n        that.dependencies = dependencies || {};\n        return that;\n    },\n    /*\n        This is used to attach a module to the core. When a module is attached\n            the core asks the module what interface it exposes\n        \n        @param {String} name - The name of this module\n\n        @param {Object} module - The implementation of the module. \n\n        @return {Object} interface - the public interface of this module is\n            returned\n    */\n    use: function use(name, module) {\n        var _interface = pd.bindAll({}, this._ee);\n        pd.bindAll(module, {\n            emit: _interface.emit\n        })\n        _interface.constructor()\n        if (Array.isArray(module.expose)) {\n            module.expose.forEach(addToInterface)\n        } else {\n            pd.extend(_interface, module.expose || module)\n        }\n        this._makeProxy(name, _interface, module)\n        return this.interfaces[name]\n\n        function addToInterface(name) {\n            _interface[name] = module[name]\n        }\n    },\n    /*\n        init will initialize the Core. This means injecting the dependencies\n            into modules based on the dependency mapping. \n\n        @param {Function} [callback] - optional callback to be invoked when\n            all modules are done injecting dependencies\n    */\n    init: function init(callback) {\n        var that = this,\n            counter = 1\n\n        Object.keys(that._interfaces).forEach(injectDeps)\n        Object.keys(that._interfaces).forEach(setupModules)\n        next()\n\n        function injectDeps(name) {\n            var module = that._modules[name],\n                deps = {}\n\n            if (that.dependencies[name]) {\n                Object.keys(that.dependencies[name]).forEach(mapToInterface)\n            }\n            pd.extend(module, deps);\n\n            function mapToInterface(key) {\n                var dependency = that.dependencies[name][key]\n                if (typeof dependency === \"string\") {\n                    deps[key] = that.interfaces[dependency]   \n                } else if (Array.isArray(dependency)) {\n                    deps[key] = dependency.map(returnInterface)\n                } else if (typeof dependency === \"object\") {\n                    deps[key] = {}\n                    Object.keys(dependency).forEach(setDependency)\n                }\n                \n                function returnInterface(dependency) {\n                    return that.interfaces[dependency]\n                }\n\n                function setDependency(name) {\n                    deps[key][name] = that.interfaces[dependency[name]]\n                }\n            }\n        }\n\n        function setupModules(name) {\n            var module = that._modules[name]\n\n            if (module.setup) {\n                if (module.setup.length === 1) {\n                    counter++\n                }\n                module.setup(next)\n            }\n        }\n\n        function next() {\n            if (--counter === 0) {\n                callback && callback()\n                Object.keys(that._modules).forEach(invokeInit)\n            }\n        }\n\n        function invokeInit(name) {\n            var module = that._modules[name]\n            module.init && module.init()\n        }\n    },\n    /*\n        remove, removes the module from the Core. It will also invoke the \n            module's destroy method, allowing the module to do clean up logic.  \n\n        @param {String} name - The module to remove\n    */\n    remove: function remove(name) {\n        var that = this,\n            module = that._modules[name]\n\n        delete that.interfaces[name]\n        delete that._interfaces[name]\n        delete that._modules[name]\n\n        module.destroy && module.destroy()\n    },\n    /*\n        purge just removes all modules from the Core. basically resetting the\n            core to a clean state.\n    */\n    purge: function purge() {\n        Object.keys(this.interfaces).forEach(callRemove, this)\n        \n        function callRemove(name) {\n            this.remove(name)\n        }\n    },\n    /*\n        makeProxy takes an interface and a module and stores a proxy of the \n            interface as the public interface under Core.interfaces\n\n        @param {String} name - name of module\n\n        @param {Object} interface - internal interface object\n\n        @param {Object} module - module object of module\n    */\n    _makeProxy: function _makeProxy(name, _interface, module) {\n        var proxy = {},\n            that = this\n\n        Object.keys(_interface).forEach(proxyProperty)\n        that._interfaces[name] = _interface\n        that._modules[name] = module\n        that.interfaces[name] = proxy\n\n        function proxyProperty(name) {\n            var value = _interface[name]\n            if (typeof value === \"function\") {\n                _interface[name] = value.bind(module)\n                proxy[name] = proxyFunction(name)\n            } else {\n                proxy[name] = value\n            }\n        }\n\n        function proxyFunction(functionName) {\n            return proxy\n\n            function proxy() {\n                return that._interfaces[name][functionName]\n                    .apply(this, arguments)\n            }\n        }\n    }\n}\n//@ sourceURL=/core.js"
));

require.define("/node_modules/eventemitter-light/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"lib/ee\"}\n//@ sourceURL=/node_modules/eventemitter-light/package.json"
));

require.define("/node_modules/eventemitter-light/lib/ee.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n    on: function on(ev, handler) {\n        var events = this._events;\n\n        (events[ev] || (events[ev] = [])).push(handler);\n    },\n    removeListener: function removeListener(ev, handler) {\n        var array = this._events[ev];\n\n        array && array.splice(array.indexOf(handler), 1);\n    },\n    emit: function emit(ev) {\n        var args = [].slice.call(arguments, 1),\n            array = this._events[ev] || [];\n\n        for (var i = 0, len = array.length; i < len; i++) {\n            array[i].apply(this, args);\n        }\n    },\n    once: function once(ev, handler) {\n        this.on(ev, proxy);\n\n        function proxy() {\n            handler.apply(this, arguments);\n            this.removeListener(ev, handler);\n        }\n    },\n    constructor: function constructor() {\n        this._events = {};\n        return this;\n    }\n};\n//@ sourceURL=/node_modules/eventemitter-light/lib/ee.js"
));

require.define("/node_modules/pd/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"lib/pd\"}\n//@ sourceURL=/node_modules/pd/package.json"
));

require.define("/node_modules/pd/lib/pd.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "/*\n    pd(obj) -> propertyDescriptorsOfObject {\n        bindAll: function that binds all the methods of an object to the object,\n        extend: function that extends the first argument with the rest\n        Name: returns a namespace(anyKey) -> uniqueObject function\n    }\n    \n    pd requires ES5. Uses the shimmable subset of ES5.\n*/\n;(function (Object, slice) {\n    \"use strict\"\n    \n    pd.bindAll = bindAll\n    pd.extend = extend\n    pd.Name = Name\n    \n    typeof module !== \"undefined\" ? module.exports = pd : window.pd = pd\n\n    /*\n        pd will return all the own propertydescriptors of the object\n\n        @param Object object - object to get pds from.\n\n        @return Object - A hash of key/propertyDescriptors\n    */    \n    function pd(obj) {\n        var pds = {}\n        Object.getOwnPropertyNames(obj).forEach(function(key) {\n            pds[key] = Object.getOwnPropertyDescriptor(obj, key)\n        })\n        return pds\n    }\n\n    /*\n        Extend will extend the firat parameter with any other parameters \n        passed in. Only the own property names will be extended into\n        the object\n\n        @param Object target - target to be extended\n        @arguments Array [target, ...] - the rest of the objects passed\n            in will extended into the target\n\n        @return Object - the target\n    */\n    function extend(target) {\n        slice.call(arguments, 1).forEach(function(source) {\n            Object.defineProperties(target, pd(source))\n        });\n        return target\n    }\n\n    /*\n        defines a namespace object. This hides a \"privates\" object on object \n        under the \"key\" namespace\n\n        @param Object object - object to hide a privates object on\n        @param Object key - key to hide it under\n\n        @author Gozala : https://gist.github.com/1269991\n\n        @return Object privates\n    */\n    function namespace(object, key) {\n        var privates = Object.create(object),\n            valueOf = object.valueOf\n        \n        Object.defineProperty(object, \"valueOf\", {\n            value: function(value) {\n                return value !== key ? valueOf.apply(this, arguments) : privates\n            },\n            writable: true,\n            configurable: true\n        })\n        \n        return privates\n    }\n    \n    /*\n        Constructs a Name function, when given an object it will return a\n        privates object. \n\n        @author Gozala : https://gist.github.com/1269991\n\n        @return Function name\n    */\n    function Name() {\n        var key = {}\n        return name\n        \n        function name(object) {\n            var privates = object.valueOf(key)\n            return privates !== object ? privates : namespace(object, key)\n        }\n    }\n    \n    /*\n        bindAll binds all methods to have their context set to the object\n\n        @param Object obj - the object to bind methods on\n        @arguments Array [target, ...] - the rest of the objects passed\n            in will extended into the obj\n\n        @return Object - the bound object\n    */\n    function bindAll(obj) {\n        pd.extend.apply(null, arguments) \n        Object.keys(obj).filter(isMethod).forEach(bindMethods)\n        return obj\n        \n        function isMethod(name) {\n            return obj[name] && obj[name].bind === isMethod.bind\n        }\n        \n        function bindMethods(name) {\n            obj[name] = obj[name].bind(obj)\n        }\n    }\n\n})(Object, [].slice)\n//@ sourceURL=/node_modules/pd/lib/pd.js"
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

require.define("/browser.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "window.nCore = require(\"./core\")\n//@ sourceURL=/browser.js"
));
require("/browser.js");

require.define("/dummy.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "(function () { \nvar Core = Object.create(nCore).constructor()\ndelete window.nCore \nCore.use('foo', require('./foo.js')) \nCore.use('bar.bar', require('./bar/bar.js')) \nCore.use('bar.foo', require('./bar/foo.js')) \nCore.use('baz', require('./baz.js')) \nCore.dependencies = {\"foo\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\",\"baz\":\"baz\"},\"bar.bar\":{\"foo\":\"foo\",\"foobar\":\"bar.bar\",\"bars\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\"}},\"bar.foo\":{\"foo\":\"foo\",\"foobar\":\"bar.foo\",\"bars\":{\"bar\":\"bar.bar\",\"foo\":\"bar.foo\"}}}\nCore.init()\n})()\n//@ sourceURL=/dummy.js"
));
require("/dummy.js");

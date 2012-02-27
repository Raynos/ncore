var ncore = require("../"),
    assert = require("assert")

suite("Core", function () {
    var Core

    setup(function () {
        Core = Object.create(ncore).constructor()
    })

    teardown(function () {
        Core.purge()
    })

    test("methods exists", function () {
        assert(Core, "Core does not exist")
        assert(Core.constructor, "constructor does not exist")
        assert(Core.use, "Core.use does not exist")
        assert(Core.init, "Core.init does not exist")
        assert(Core.remove, "Core.remove does not exist")
        assert(Core.purge, "Core.purge does not exist")
    })

    suite("Core.use", function () {
        test("define is invoked when a module is used", function (done) {
            define(Core, function () {
                assert(true, "define was not called")
                done()
            })
        })

        test("define is passed an interface", function (done) {
            define(Core, function (interface) {
                assert(interface, "interface does not exist")
                done()
            })
        })

        test("interface is stored on interfaces", function () {
            Core.use("name", {})
            assert(Core.interfaces.name, "interfaces is not set")
        })

        test("interface is an eventemitter", function (done) {
            define(Core, function (interface) {
                assert(interface.on, "interface is not an eventemitter")
                done()
            })
        })

        test("public interface is an event emitter", function () {
            define(Core)
            assert(Core.interfaces.name.on, "interface is not an EE")
        })

        test("interface properties are persisted", function () {
            define(Core, function (interface) {
                interface.foo = 42
            })
            assert.equal(Core.interfaces.name.foo, 42, 
                "interface changes were not persisted")
        })

        test("interfaces are proxied", function () {
            var cached_interface
            define(Core, function (interface) {
                cached_interface = interface
                interface.method = function (echo) {
                    return echo
                }
            })
            assert.notEqual(cached_interface, Core.interfaces.name,
                "the interfaces are the same")
            assert.notEqual(cached_interface.method, 
                Core.interfaces.name.method, "the methods are the same")
            assert.equal(Core.interfaces.name.method(42), 42,
                "echo method does not work")
        })

        test("this value is correct", function () {
            define(Core, function (interface) {
                interface.method = function () {
                    return this.define
                }
            })
            assert(Core.interfaces.name.method(), "this is incorrect")
        })

        test("interface only has what is exposed", function () {
            define(Core, function (interface) {
                interface.method = function () {}
            })
            assert.equal(Object.keys(Core.interfaces.name).length,
                // 1 + 5 from the eventemitter (on, removeListener, once,
                //  emit, constructor)
                6, "interface has too many keys")
        })

        test("Core supports objects", function () {
            Core.use("name", {
                define: {
                    foo: "bar"
                }
            })
            assert.equal(Core.interfaces.name.foo, "bar",
                "interface is not exposed properly")
        })

        test("use returns the public interface", function () {
            var name = define(Core)
            assert.equal(Core.interfaces.name, name,
                "name is not the public interface");
        })
    })

    suite("Core.constructor", function () {
        test("exposes interfaces", function () {
            assert(Core.interfaces, "interfaces is not exposed")
        })

        test("can pass in custom ee", function (done) {
            var ee = { bar: 42 }
            Core = Object.create(ncore).constructor(null, ee)
            define(Core, function (interface) {
                assert.equal(interface.bar, 42, "custom ee not used")
                done()
            })
        })

        test("can pass in dependencies", function () {
            Core = Object.create(ncore).constructor({
                foo: "bar"
            })
            assert.equal(Core.dependencies.foo, "bar",
                "dependency not loaded properly")
        })

        test("can pass in dependency JSON string", function () {
            Core = Object.create(ncore).constructor(
                "{ \"foo\": \"bar\" }"
            )
            assert.equal(Core.dependencies.foo, "bar",
                "dependency not loaded properly")
        })

        test("exposes dependency", function () {
            assert(Core.dependencies, "dependencies are not exposed")
        })
    })

    suite("Core.remove", function () {
        test("removes interface from interfaces", function () {
            define(Core)
            Core.remove("name")
            assert(!Core.interfaces.name, "interface not removed")
        })

        test("removes interface and module from internal lists", function () {
            define(Core)
            Core.remove("name")
            assert(!Core._interfaces.name, "_interface is not removed")
            assert(!Core._modules.name, "_modules is not removed")
        })

        test("calls destroy on module", function (done) {
            Core.use("name", {
                destroy: function () {
                    assert(true, "was not called");
                    done();
                }
            })
            Core.remove("name");
        })
    })

    suite("Core.purge", function () {
        test("removes all interfaces from core", function () {
            define(Core)
            Core.use("name2", {})
            Core.purge()
            assert.equal(Object.keys(Core.interfaces).length, 0
                , "interfaces still exist")
        })

        test("removes internal storage from core", function () {
            define(Core)
            Core.use("name2", {})
            Core.purge()
            assert.equal(Object.keys(Core._interfaces).length, 0
                , "interfaces still exist")
            assert.equal(Object.keys(Core._modules).length, 0
                , "interfaces still exist")
        })

        test("calles destroy on module", function (done) {
            Core.use("name", {
                destroy: function () { done() }
            })
            Core.purge()
        })
    })

    suite("Core.init", function () {
        test("init works with normal modules", function () {
            inject(Core)
            Core.init()
            assert(Core.interfaces.name, "module does not exist")
        })

        test("init calls inject", function (done) {
            inject(Core, function () {
                assert(true, "was not called")
                done()
            })
            Core.init()
        })

        test("init injects dependencies", function (done) {
            inject(Core, function (deps) {
                assert.equal(deps.bar.foo, "bar",
                    "dependency is not injected properly")
                done()
            })
            Core.dependencies.name = {
                bar: "bar"
            }
            Core.use("bar", {
                define: {
                    foo: "bar"
                }
            })
            Core.init()
        })

        test("init invokes callback", function (done) {
            inject(Core);

            Core.init(function () {
                assert(true, "callback called");
                done();
            })
        })

        test("init invokes callback after done", function (done) {
            var counter = 0;
            inject(Core, function (deps, done) {
                counter++;
                done();
            })

            Core.init(function () {
                assert(counter === 1, "counter is wrong");
                done();
            })
        })

        test("init invokes init after callback", function (done) {
            var counter = 0;
            Core.use("name", {
                inject: function (_, done) {
                    counter++;
                    assert.equal(counter, 1, "counter incorrect");
                    done();
                },
                init: function () {
                    counter++;
                    assert.equal(counter, 3, "counter incorrect");
                    done();
                }
            })

            Core.init(function () {
                counter++;
                assert.equal(counter, 2, "counter incorrect");
            })
        })

        test("dependencies are mixed in", function () {
            Core.use("name", {
                foo: function () { return this.bar },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bar: "bar"
            };
            Core.use("bar", {});
            Core.init();
            assert(Core.interfaces.name.foo(), "bar not mixed in");
        })

        test("dependency format supports arrays", function () {
            var name = Core.use("name", {
                foo: function () { return this.bars },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bars: ["bar", "foo", "baz"]
            };
            Core.use("bar", {})
            Core.use("foo", {})
            Core.use("baz", {})
            Core.init()
            assert.equal(name.foo().length, 3, "length is not correct")
        })
    })
})

function define(Core, define) {
    return Core.use("name", {
        define: define
    })
}

function inject(Core, inject) {
    return Core.use("name", {
        inject: inject
    })
}
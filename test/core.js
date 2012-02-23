var nCore = require("../lib/core"),
    assert = require("assert")

suite("Core", function () {
    var Core

    setup(function () {
        Core = Object.create(nCore).constructor()
    })

    teardown(function () {
        Core.purge()
    })

    test("methods exists", function () {
        assert(Core, "Core does not exist")
        assert(Core.constructor, "constructor does not exist")
        assert(Core.use, "Core.use does not exist")
        assert(Core.init, "Core.init does not exist")
        assert(Core.module, "Core.module does not exist")
        assert(Core.remove, "Core.remove does not exist")
        assert(Core.purge, "Core.purge does not exist")
    })

    suite("Core.use", function () {
        test("attach is invoked when a module is used", function (done) {
            attach(Core, function () {
                assert(true, "attach was not called")
                done()
            })
        })

        test("attach is passed an interface", function (done) {
            attach(Core, function (interface) {
                assert(interface, "interface does not exist");
                done();
            })
        })

        test("interface is stored on interfaces", function () {
            Core.use("name", {})
            assert(Core.interfaces.name, "interfaces is not set")
        })

        test("interface is an eventemitter", function (done) {
            attach(Core, function (interface) {
                assert(interface.on, "interface is not an eventemitter")
                done()
            })
        })

        test("interface properties are persisted", function () {
            attach(Core, function (interface) {
                interface.foo = 42
            });
            assert.equal(Core.interfaces.name.foo, 42, 
                "interface changes were not persisted")
        })

        test("interfaces are proxied", function () {
            var cached_interface
            attach(Core, function (interface) {
                cached_interface = interface
                interface.method = function (echo) {
                    return echo
                }
            })
            assert.notEqual(cached_interface, Core.interfaces.name,
                "the interfaces are the same");
            assert.notEqual(cached_interface.method, 
                Core.interfaces.name.method, "the methods are the same")
            assert.equal(Core.interfaces.name.method(42), 42,
                "echo method does not work");
        })

        test("this value is correct", function () {
            attach(Core, function (interface) {
                interface.method = function () {
                    return this.attach;
                }
            })
            assert(Core.interfaces.name.method(), "this is incorrect");
        })

        test("interface only has what is exposed", function () {
            attach(Core, function (interface) {
                interface.method = function () {}
            })
            assert.equal(Object.keys(Core.interfaces.name).length,
                1, "interface has too many keys")
        })
    })

    suite("Core.constructor", function () {
        test("exposes interfaces", function () {
            assert(Core.interfaces, "interfaces is not exposed")
        })

        test("can pass in custom ee", function (done) {
            var ee = { bar: 42 }
            Core = Object.create(nCore).constructor(ee)
            attach(Core, function (interface) {
                assert.equal(interface.bar, 42, "custom ee not used")
                done()
            })
        })
    })

    suite("Core.remove", function () {
        test("removes interface from interfaces", function () {
            attach(Core)
            Core.remove("name")
            assert(!Core.interfaces.name, "interface not removed")
        }) 
    })
})

function attach(Core, attach) {
    Core.use("name", {
        attach: attach
    })
}
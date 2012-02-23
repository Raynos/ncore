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
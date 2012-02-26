var ncore = require(".."),
    assert = require("assert"),
    ModuleLoader = require("../modules/moduleLoader")

suite("moduleLoader", function () {
    var Core,
        moduleLoader

    setup(function () {
        Core = Object.create(ncore).constructor()
        moduleLoader = Core.use("moduleLoader", ModuleLoader)
    })

    teardown(function () {
        Core.purge()
    })

    test("methods exist", function () {
        assert(moduleLoader, "moduleLoader does not exist")
        assert(moduleLoader.load, "moduleLoader.load does not exist")
    })

    suite("moduleLoader.load", function () {
        test("loading folder loades all files recursively", function () {
            moduleLoader.load("./modules")
            assert(Core.interfaces.foo, "module foo was not loaded")
            assert(Core.interfaces["bar.bar"], "module bar.bar was not loaded")
            assert(Core.interfaces["bar.foo"], "module bar.foo was not loaded")
        })
    })
})
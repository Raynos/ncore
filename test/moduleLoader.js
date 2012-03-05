var ncore = require(".."),
    path = require("path"),
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
        test("loading folder loades all files recursively", function (done) {
            loadModules(function (err) {
                if (err) throw err;
                //console.log(Core.interfaces);
                assert(Core.interfaces.foo, "module foo was not loaded")
                assert(Core.interfaces["bar.bar"], 
                    "module bar.bar was not loaded")
                assert(Core.interfaces["bar.foo"], 
                    "module bar.foo was not loaded")
                done()
            })
        })

        test("dependency.json file is handled properly", function (done) {
            loadModules(function () {
                Core.init()

                var foo = Core.interfaces.foo
                var bar = Core.interfaces["bar.bar"]
                var barfoo = Core.interfaces["bar.foo"]

                assert.equal(foo.has("bar"), bar,
                    "bar depedency on foo did not work")
                assert.equal(foo.has("foo"), barfoo,
                    "foo dependency on foo did not work")
                testBars(bar, "bar")
                testBars(barfoo, "barfoo")
                assert.equal(bar.has("foobar"), bar,
                    "foobar dependency on bar did not work")
                assert.equal(barfoo.has("foobar"), barfoo,
                    "foobar dependency on barfoo did not work")

                done()

                function testBars(_bar, text) {
                    assert.equal(_bar.has("foo"), foo,
                        "foo dependency on "+text+" did not work")
                    assert.equal(_bar.has("bars").bar, bar,
                        "bars array does not contain bar on "+text)
                    assert.equal(_bar.has("bars").foo, barfoo,
                        "bars array does not contain barfoo on "+text)
                }

            })
        })
    })

    function loadModules(callback) {
        moduleLoader.load({
            uri: path.join(__dirname, "./modules"),
            dependencies: require("./modules/dependency.json"),
            core: Core,
            callback: callback
        })
    }
})

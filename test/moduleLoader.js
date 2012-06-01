var ncore = require(".."),
    path = require("path"),
    assert = require("assert"),
    ModuleLoader = require("../modules/moduleLoader")

suite("moduleLoader", function () {
    var Core,
        moduleLoader

    setup(function () {
        Core = Object.create(ncore).constructor()
        moduleLoader = Core.add("moduleLoader", ModuleLoader)
    })

    test("methods exist", function () {
        assert(moduleLoader, "moduleLoader does not exist")
        assert(moduleLoader.load, "moduleLoader.load does not exist")
    })

    suite("moduleLoader.load", function () {
        test("loading folder loades all files recursively", function (done) {
            loadModules(function (err) {
                if (err) throw err;
                assert(Core.proxies["foo.js"], "module foo was not loaded")
                assert(Core.proxies["bar/bar.js"], 
                    "module bar.bar was not loaded")
                assert(Core.proxies["bar/foo.js"], 
                    "module bar.foo was not loaded")
                done()
            })
        })

        test("dependency is handled properly", function (done) {
            loadModules(function () {
                var foo = Core.proxies["foo.js"]
                var bar = Core.proxies["bar/bar.js"]
                var barfoo = Core.proxies["bar/foo.js"]

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
            core: Core
        }, function (err) {
            Core.dependencies = {
                "foo.js": {
                    "bar": "bar/bar.js",
                    "foo": "bar/foo.js",
                    "baz": "baz.js"
                },
                "bar/foo.js": {
                    "foo": "foo.js",
                    "bars": {
                        "foo": "bar/foo.js", 
                        "bar": "bar/bar.js"
                    },
                    "foobar": "bar/foo.js"
                },
                "bar/bar.js": {
                    "foo": "foo.js",
                    "bars": {
                        "foo": "bar/foo.js", 
                        "bar": "bar/bar.js"
                    },
                    "foobar": "bar/bar.js"
                }
            }
            Core.init(callback)
        })
    }
})
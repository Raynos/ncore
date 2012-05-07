var path = require("path"),
    assert = require("assert"),
    core = require("../modules/core")

suite("modules/core", function () {
    test("core exists", function () {
        assert(core, "core exists")
    })

    test("core loads modules properly", function (done) {
        loadModules(function (Core) {
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
    var Core = core({
        uri: path.join(__dirname, "modules"),
        dependencyMapper: {
            jsonUri: path.join(__dirname, "modules", "dependency.json")
        }
    }, function () {
        callback(Core)
    })
}
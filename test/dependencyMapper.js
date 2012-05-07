var path = require("path"),
    assert = require("assert"),
    DependencyMapper = require("../modules/dependencyMapper")

suite("dependencyMapper", function () {
    test("methods exist", function () {
        assert(DependencyMapper, "dependency mapper does not exist")
        assert(DependencyMapper.map, "dependency mapper.map does not exist")
    })

    test("maps dependencies correctly", function (done) {
        DependencyMapper.map({
            jsonUri: path.join(__dirname, "modules", "dependency.json"),
            uri: path.join(__dirname, "modules")
        }, function (err, json) {
            assert.equal(err, null, "error is null")
            assert(json["foo.js"], "no foo.js")
            assert(json["bar/bar.js"], "no bar/bar.js")
            assert(json["bar/foo.js"], "no bar/foo.js")

            assert.equal(json["foo.js"]["bar"], "bar/bar.js",
                "foo.js bar is wrong")
            assert.equal(json["foo.js"]["foo"], "bar/foo.js",
                "foo.js foo is wrong")
            assert.equal(json["foo.js"]["baz"], "baz.js",
                "foo.js baz is wrong")

            assert.equal(json["bar/bar.js"]["foo"], "foo.js",
                "bar/bar.js foo is wrong")
            assert.deepEqual(json["bar/bar.js"]["bars"], {
                "bar": "bar/bar.js",
                "foo": "bar/foo.js"
            }, "bar/bar.js bars is wrong")
            assert.equal(json["bar/bar.js"]["foobar"], "bar/bar.js",
                "bar/bar.js foobar is wrong")

            assert.equal(json["bar/foo.js"]["foo"], "foo.js",
                "bar/foo.js foo is wrong")
            assert.deepEqual(json["bar/foo.js"]["bars"], {
                "bar": "bar/bar.js",
                "foo": "bar/foo.js"
            }, "bar/foo.js bars is wrong")
            assert.equal(json["bar/foo.js"]["foobar"], "bar/foo.js",
                "bar/foo.js foobar is wrong")

            done()
        })
    })
})
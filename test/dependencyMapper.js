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
            console.log(json)

            done()
        })
    })
})
var ncore = require(".."),
    extend = require("pd").extend,
    Core = extend({}, ncore).constructor({
        "main": {
            "hello": "hello",
            "world": "world"
        }
    })

Core.add("hello", {
    hello: function () {
        return "hello"
    },
    expose: ["hello"]
})

Core.add("world", function () {
    return "world"
})

Core.add("main", {
    init: function () {
        console.log(this.hello.hello() + " " + this.world())
    }
})

Core.init()
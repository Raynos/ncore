var ncore = require(".."),
    assert = require("assert")

suite("Core", function () {
    var Core

    setup(function () {
        Core = Object.create(ncore).constructor()
    })

    test("methods exists", function () {
        assert(Core, "Core does not exist")
        assert(Core.constructor, "constructor does not exist")
        assert(Core.add, "Core.add does not exist")
        assert(Core.init, "Core.init does not exist")
    })

    suite("Core.add", function () {
        test("interface is stored on interfaces", function () {
            Core.add("name", {})
            assert(Core.proxies.name, "interfaces is not set")
        })

        test("interface can emit events", function () {
            Core.add("name", {
                method: function () {
                    assert(this.emit, "interface is not an eventemitter")
                },
                expose: ["method"]
            }).method()
        })

        test("interface without expose is public", function (done) {
            Core.add("name", {
                method: function () {
                    assert("like a boss", "it doesnt work")
                    done()
                }
            }).method()
        })

        test("public interface is an event emitter", function () {
            var name = Core.add("name", {})
            assert(name.on, "interface is not an EE")
            // ee throws error if not initialized
            name.emit("foo")
        })

        test("this value is correct", function () {
            Core.add("name", {
                method: function () {
                    return this.expose
                },
                expose: ["method"]
            })
            assert(Core.proxies.name.method(), "this is incorrect")
        })

        test("interface only has what is exposed", function () {
            Core.add("name", {
                method: function () {},
                expose: ["method"]
            })
            //console.log(Object.keys(Core.proxies.name))
            assert.equal(Object.keys(Core.proxies.name).length,
                // 1 + 9 from the eventemitter (on, removeListener, once,
                //  emit, addListener, listeners, constructor,
                // setMaxListeners, removeAllListeners,)
                10, "interface has too many keys")
        })

        test("can add functions", function () {
            var n = Core.add("name", function () {
                return 42
            })
            assert.equal(n(), 42, "interface is not correct number")
        })

        test("add returns the public interface", function () {
            var name = Core.add("name", {})
            assert.equal(Core.proxies.name, name,
                "name is not the public interface");
        })
    })

    suite("Core.constructor", function () {
        test("exposes interfaces", function () {
            assert(Core.proxies, "interfaces is not exposed")
        })

        test("can pass in dependencies", function () {
            Core = Object.create(ncore).constructor({
                foo: "bar"
            })
            assert.equal(Core.dependencies.foo, "bar",
                "dependency not loaded properly")
        })

        test("exposes dependency", function () {
            assert(Core.dependencies, "dependencies are not exposed")
        })
    })

    suite("Core.init", function () {
        test("init works with normal modules", function () {
            Core.add("name", {})
            Core.init()
            assert(Core.proxies.name, "module does not exist")
        })

        test("init calls setup", function (done) {
            Core.add("name", {
                setup: function () {
                    assert(true, "was not called")
                    done()
                }
            })
            Core.init()
        })

        test("init invokes callback", function (done) {
            Core.add("name", {})

            Core.init(function () {
                assert(true, "callback called");
                done();
            })
        })

        test("init invokes callback after done", function (done) {
            var counter = 0;
            
            Core.add("name",{
                setup: function (done) {
                    counter++;
                    done();
                }
            })

            Core.init(function () {
                assert(counter === 1, "counter is wrong");
                done();
            })
        })

        test("init invokes init after callback", function (done) {
            var counter = 0;
            Core.add("name", {
                setup: function (done) {
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
            Core.add("name", {
                foo: function () { return this.bar },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bar: "bar"
            };
            Core.add("bar", {});
            Core.init();
            assert(Core.proxies.name.foo(), "bar not mixed in");
        })

        test("dependency format supports arrays", function () {
            var name = Core.add("name", {
                foo: function () { return this.bars },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bars: ["bar", "foo", "baz"]
            };
            Core.add("bar", {})
            Core.add("foo", {})
            Core.add("baz", {})
            Core.init()
            assert.equal(name.foo().length, 3, "length is not correct")
        })
    })
})

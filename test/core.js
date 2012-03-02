var ncore = require("../"),
    assert = require("assert")

suite("Core", function () {
    var Core

    setup(function () {
        Core = Object.create(ncore).constructor()
    })

    teardown(function () {
        Core.purge()
    })

    test("methods exists", function () {
        assert(Core, "Core does not exist")
        assert(Core.constructor, "constructor does not exist")
        assert(Core.use, "Core.use does not exist")
        assert(Core.init, "Core.init does not exist")
        assert(Core.remove, "Core.remove does not exist")
        assert(Core.purge, "Core.purge does not exist")
    })

    suite("Core.use", function () {
        test("interface is stored on interfaces", function () {
            Core.use("name", {})
            assert(Core.interfaces.name, "interfaces is not set")
        })

        test("interface can emit events", function () {
            Core.use("name", {
                method: function () {
                    assert(this.emit, "interface is not an eventemitter")
                },
                expose: ["method"]
            }).method()
        })

        test("interface without expose is public", function (done) {
            Core.use("name", {
                method: function () {
                    assert("like a boss", "it doesnt work")
                    done()
                }
            }).method()
        })

        test("public interface is an event emitter", function () {
            var name = Core.use("name", {})
            assert(name.on, "interface is not an EE")
            // ee throws error if not initialized
            name.emit("foo")
        })

        test("interface properties are persisted", function () {
            Core.use("name", {
                foo: 42,
                expose: ["foo"]
            })
            assert.equal(Core.interfaces.name.foo, 42, 
                "interface changes were not persisted")
        })

        test("this value is correct", function () {
            Core.use("name", {
                method: function () {
                    return this.expose
                },
                expose: ["method"]
            })
            assert(Core.interfaces.name.method(), "this is incorrect")
        })

        test("interface only has what is exposed", function () {
            Core.use("name", {
                method: function () {},
                expose: ["method"]
            })
            assert.equal(Object.keys(Core.interfaces.name).length,
                // 1 + 6 from the eventemitter (on, removeListener, once,
                //  emit, constructor, _events)
                7, "interface has too many keys")
        })

        test("Core supports objects", function () {
            Core.use("name", {
                expose: {
                    foo: "bar"
                }
            })
            assert.equal(Core.interfaces.name.foo, "bar",
                "interface is not exposed properly")
        })

        test("use returns the public interface", function () {
            var name = Core.use("name", {})
            assert.equal(Core.interfaces.name, name,
                "name is not the public interface");
        })
    })

    suite("Core.constructor", function () {
        test("exposes interfaces", function () {
            assert(Core.interfaces, "interfaces is not exposed")
        })

        test("can pass in custom ee", function () {
            var ee = { bar: 42 }
            Core = Object.create(ncore).constructor(null, ee)
            var name = Core.use("name", {})
            assert.equal(name.bar, 42, "custom ee not used")
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

    suite("Core.remove", function () {
        test("removes interface from interfaces", function () {
            Core.use("name", {})
            Core.remove("name")
            assert(!Core.interfaces.name, "interface not removed")
        })

        test("removes interface and module from internal lists", function () {
            Core.use("name", {})
            Core.remove("name")
            assert(!Core._interfaces.name, "_interface is not removed")
            assert(!Core._modules.name, "_modules is not removed")
        })

        test("calls destroy on module", function (done) {
            Core.use("name", {
                destroy: function () {
                    assert(true, "was not called");
                    done();
                }
            })
            Core.remove("name");
        })
    })

    suite("Core.purge", function () {
        test("removes all interfaces from core", function () {
            Core.use("name", {})
            Core.use("name2", {})
            Core.purge()
            assert.equal(Object.keys(Core.interfaces).length, 0
                , "interfaces still exist")
        })

        test("removes internal storage from core", function () {
            Core.use("name", {})
            Core.use("name2", {})
            Core.purge()
            assert.equal(Object.keys(Core._interfaces).length, 0
                , "interfaces still exist")
            assert.equal(Object.keys(Core._modules).length, 0
                , "interfaces still exist")
        })

        test("calles destroy on module", function (done) {
            Core.use("name", {
                destroy: function () { done() }
            })
            Core.purge()
        })
    })

    suite("Core.init", function () {
        test("init works with normal modules", function () {
            Core.use("name", {})
            Core.init()
            assert(Core.interfaces.name, "module does not exist")
        })

        test("init calls setup", function (done) {
            Core.use("name", {
                setup: function () {
                    assert(true, "was not called")
                    done()
                }
            })
            Core.init()
        })

        test("init invokes callback", function (done) {
            Core.use("name", {})

            Core.init(function () {
                assert(true, "callback called");
                done();
            })
        })

        test("init invokes callback after done", function (done) {
            var counter = 0;
            
            Core.use("name",{
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
            Core.use("name", {
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
            Core.use("name", {
                foo: function () { return this.bar },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bar: "bar"
            };
            Core.use("bar", {});
            Core.init();
            assert(Core.interfaces.name.foo(), "bar not mixed in");
        })

        test("dependency format supports arrays", function () {
            var name = Core.use("name", {
                foo: function () { return this.bars },
                expose: ["foo"]
            });

            Core.dependencies.name = {
                bars: ["bar", "foo", "baz"]
            };
            Core.use("bar", {})
            Core.use("foo", {})
            Core.use("baz", {})
            Core.init()
            assert.equal(name.foo().length, 3, "length is not correct")
        })
    })
})
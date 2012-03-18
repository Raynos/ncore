suite("nCore", function () {

    test("exposes modules", function () {
        assert(foo, "foo does not exist")
        assert(window["bar.foo"], "bar.foo does not exist")
        assert(window["bar.bar"], "bar.bar does not exist")
    })

    test("assert dependencies", function () {
        var foo = window.foo
        var bar = window["bar.bar"]
        var barfoo = window["bar.foo"]
        var baz = window.baz

        assert(foo.has("bar") === bar,
            "bar depedency on foo did not work")
        assert(foo.has("foo") === barfoo,
            "foo dependency on foo did not work")
        console.log(foo.has("baz"), baz)
        assert(foo.has("baz") === baz,
            "baz dependency on foo did not work")
        testBars(bar, "bar")
        testBars(barfoo, "barfoo")
        assert(bar.has("foobar") === bar,
            "foobar dependency on bar did not work")
        assert(barfoo.has("foobar") === barfoo,
            "foobar dependency on barfoo did not work")

        function testBars(_bar, text) {
            assert(_bar.has("foo") === foo,
                "foo dependency on "+text+" did not work")
            assert(_bar.has("bars").bar,
                "bars array does not contain bar on "+text)
            assert(_bar.has("bars").barfoo !== -1,
                "bars array does not contain barfoo on "+text)
        }

    })

    function assert(expr, msg) {
        if (!expr) throw new Error(msg || 'failed');
    }
})
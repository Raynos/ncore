suite("nCore", function () {
    test("nCore exists", function () {
        assert(nCore, "nCore does not exist")
    })

    test("exposes modules", function () {
        assert(foo, "foo does not exist")
        assert(window["bar.foo"], "bar.foo does not exist")
        assert(window["bar.bar"], "bar.bar does not exist")
    })

    function assert(expr, msg) {
        if (!expr) throw new Error(msg || 'failed');
    }
})
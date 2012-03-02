module.exports = {
    setup: function() {
        typeof window !== "undefined" && (window["bar.foo"] = this)
    },
    has: function (name) {
        return this[name]
    },
    expose: ["has"]
};
module.exports = {
    setup: function () {
        typeof window !== "undefined" && (window["foo"] = this.foo)
    },
    has: function (name) {
        return this[name]
    },
    expose: ["has"]
};
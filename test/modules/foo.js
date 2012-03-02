module.exports = {
    init: function () {
        typeof window !== "undefined" && (window["bar.bar"] = this.bar)
        typeof window !== "undefined" && (window["bar.foo"] = this.foo)
    },
    has: function (name) {
        return this[name];
    },
    expose: ["has"]
};
module.exports = {
    setup: function () {
        typeof window !== "undefined" && (window["bar.bar"] = this)
    },
    has: function (name) {
        return this[name]
    },
    expose: ["has"]
};
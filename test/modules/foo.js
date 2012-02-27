module.exports = {
    has: function (name) {
        return this[name];
    },
    expose: ["has"]
};
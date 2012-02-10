module.exports = {
    on: function on(ev, handler) {
        var events = this._events;

        (events[ev] || (events[ev] = [])).push(handler);
    },
    removeListener: function removeListener(ev, handler) {
        var array = this._events[ev];

        array && array.splice(array.indexOf(handler), 1);
    },
    emit: function emit(ev) {
        var args = [].slice.call(arguments, 1),
            array = this._events[ev] || [];

        for (var i = 0, len = array.length; i < len; i++) {
            array[i].apply(this, args);
        }
    },
    once: function once(ev, handler) {
        this.on(ev, proxy);

        function proxy() {
            handler.apply(this, arguments);
            this.removeListener(ev, handler);
        }
    },
    constructor: function constructor() {
        this._events = {};
        return this;
    }
};
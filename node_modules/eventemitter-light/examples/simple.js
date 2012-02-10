var EventEmitter = require("../lib/ee.js");

var ee = Object.create(EventEmitter).constructor();

ee.on('foo.namespaces', logFoo);
ee.emit('*.namespaces');

function logFoo() {
    console.log('foo');
}
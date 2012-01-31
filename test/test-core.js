var assert = require("assert"),
	nCore = require("../lib/core.js");

suite("Core", function () {
	test("Core exists", function () {
		var Core = instance();
		assert(Core, "core does not exist");
		assert(Core.use, "core does not have use method");
		assert(Core.remove, "core does not have remove method");
	});

	test("Core use", function (done) {
		var Core = instance();
		var module = {
			attach: function (mediator) {
				assert(true, "does not get invoked");
				assert(mediator.on, 
					"mediator is not an event emitter");
				assert.equal(mediator, Core,
					"mediator is not Core");
				done();
			}
		};

		Core.use("module", module);
	});

	test("Core use names", function (done) {
		var count = 0;
		var Core = instance();
		var module1 = {
			attach: function () { count++; },
			detach: function () { count++; }
		};
		var module3 = {
			module3: {
				attach: function () { count++; },
				detach: function () { count++; }
			}
		};

		Core.use("module1", module1);
		Core.use(module3);
		Core.remove("module1");
		Core.remove(module3);

		assert.equal(count, 4,
			"methods were not invoked as expected");
		done();
	});

	test("destroy fires on destroy", function (done) {
		var module = { destroy: done };
		var Core = instance();

		Core.module("name", module);
		Core.emit("destroy");
	})

	test("Core remove", function (done) {
		var Core = instance();
		var module = {
			detach: function (mediator) {
				assert(true, "detach is not called");
				assert.equal(mediator, Core,
					"Core is not the same as mediator");
				done();
			}
		}

		Core.use("module", module);
		Core.remove("module");
	});

	test("Core remove on object without detach", function (done) {
		var Core = instance();
		Core.use("module", {});
		Core.remove("module");
		done();
	});

	test("Core purge", function (done) {
		var i = 0;
		var Core = instance();
		var module = {
			attach: function () {
				this.mediator.on("foo", this.foo);
			},
			foo: function () {
				i++;
			},
			init: function () {
				i++;
			}
		};

		Core.module("module", module);
		Core.emit("init");
		Core.purge();
		Core.emit("foo");
		Core.emit("init");
		assert(i === 1);
		done();
	});

	test("Core module", function (done) {
		var Core = instance(),
			count = 0;

		var module = {
			attach: function () {
				assert.equal(this.mediator, Core,
					"mediator is not Core");
				this.foo();
			},
			foo: function () {
				assert.equal(this, module, 
					"this is not module");
			},
			init: function () {
				count++;
			},
			destroy: function () {
				count++;
			}
		};

		Core.module("module", module);
		Core.emit("init");
		Core.emit("destroy");
		assert(count === 2, "count is wrong");
		done();
	});
});

function instance() {
	return Object.create(nCore).constructor();
}
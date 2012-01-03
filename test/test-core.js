var assert = require("assert"),
	nCore = require("../src/core.js").nCore;

suite("Core", function () {
	test("Core exists", function () {
		var Core = Object.create(nCore).constructor();
		assert(Core, "core does not exist");
		assert(Core.use, "core does not have use method");
		assert(Core.init, "core does not have init method");
		assert(Core.destroy, "core does not have destroy method");
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

	test("Core use on initialized core", function (done) {
		var Core = instance();
		var module = {
			init: function () {
				assert(true, "init does not get called");
				done();
			}
		}

		Core.init();
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

	test("Core init", function (done) {
		var Core = instance();
		var module = {
			attach: function () {},
			init: function (mediator) {
				assert(true, "init did not get called");
				done();
			}
		}

		Core.use("module", module);
		Core.init();
	});

	test("Core remove on initialized modules", function (done) {
		var Core = instance();
		var module = {
			destroy: function () {
				assert(true, "destroy is not called");
				done();
			}
		}

		Core.use("module", module);
		Core.init();
		Core.remove("module");
	});

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

	test("Core destroy", function (done) {
		var counter = 0;
		var Core = instance();
		var module = {
			detach: function () {
				assert.equal(counter, 1, "counter is not correct");
				done();
			},
			destroy: function () {
				assert(true, "destroy is not called");
				counter++;
			}
		}

		Core.use("module", module);
		Core.init();
		Core.destroy();
	});
});

function instance() {
	return Object.create(nCore).constructor();
}
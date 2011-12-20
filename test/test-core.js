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
		var Core = Object.create(nCore).constructor();
		var obj = {};
		var module = {
			attach: function (data, mediator) {
				assert(true, "does not get invoked");
				assert(mediator.on, 
					"mediator is not an event emitter");
				assert.equal(mediator, Core,
					"mediator is not Core");
				assert.equal(this, Core,
					"this is not Core");
				assert.equal(data, obj,
					"data is not passed in correctly");
				done();
			}
		};

		Core.use("module", module, obj);
	});

	test("Core use on initialized core", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			init: function (done) {
				assert(true, "init does not get called");
				done();
			}
		}

		Core.init();
		Core.use("module", module, function () {
			assert(true, "callback does not get called");
			done();
		});
	});

	test("Core use names", function (done) {
		var count = 0;
		var Core = Object.create(nCore).constructor();
		var module1 = {
			attach: function () { count++; },
			detach: function () { count++; }
		};
		var module2 = {
			name: "module2",
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
		Core.use(module2);
		Core.use(module3);
		Core.remove("module1");
		Core.remove(module2);
		Core.remove(module3);

		assert.equal(count, 6,
			"methods were not invoked as expected");
		done();
	});

	test("Core init", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			init: function (done, mediator) {
				assert.equal(typeof done, "function",
					"done callback is not a function");
				assert.equal(mediator, Core,
					"mediator is not Core");
				assert.equal(this, Core,
					"this is not Core");
				done();
			}
		}

		Core.use("module", module);
		Core.init(function () {
			assert(true, "callback does not get called");
			done();
		})
	});

	test("Core init with options", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			init: function (done) {
				done();
			}
		}

		Core.use("module", module);
		Core.init({}, function () {
			assert(true, "callback does not get called");
			done();
		})
	});

	test("Core remove on initialized modules", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			init: function () {},
			detach: function () {},
			destroy: function () {
				assert(true, "remove is not called");
				done();
			}
		}

		Core.use("module", module);
		Core.init();
		Core.remove("module");
	});

	test("Core remove", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			detach: function (mediator) {
				assert(true, "detach is not called");
				assert.equal(this, Core, "this is not the same as Core");
				assert.equal(mediator, Core,
					"Core is not the same as mediator");
				done();
			}
		}

		Core.use("module", module);
		Core.remove("module");
	});

	test("Core destroy", function (done) {
		var Core = Object.create(nCore).constructor();
		var module = {
			attach: function () {},
			detach: function () {},
			init: function () {},
			destroy: function (done, mediator) {
				assert(true, "destroy is not called");
				assert.equal(typeof done, "function",
					"done is not a function");
				assert.equal(this, Core, "this is not Core");
				assert.equal(mediator, Core, 
					"mediator is not the Core");
				done();
			}
		}

		Core.use("module", module);
		Core.init();
		Core.destroy(function () {
			assert(true, "callback is not called");
			done();
		});
	});
});
REPORTER = spec

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--ui tdd \
		--bail \
		--reporter $(REPORTER)

browser:
	browserify ./lib/core.js -o dist/core.js

build-test:
	./bin/ncore -o /test/browser/build.js ./test/modules/

.PHONY: test build-test browser
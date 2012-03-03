REPORTER = spec

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--ui tdd \
		--bail \
		--reporter $(REPORTER)

test-cov: lib-cov
	@NCORE_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

browser:
	browserify ./lib/browser.js -o dist/core.js

build-test:
	./bin/ncore -o /test/browser/build.js ./test/modules/
	
webmake: 
	./node_modules/.bin/webmake ./lib/browser.js dist/core.js

.PHONY: test test-cov webmake build-test browser
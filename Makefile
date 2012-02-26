REPORTER = spec

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--ui tdd \
		--reporter $(REPORTER)

test-cov: lib-cov
	@NCORE_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov


.PHONY: test test-cov

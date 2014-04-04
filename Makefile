SOURCES = src/*.js src/link/*.js src/proxy/*.js interface/*.js providers/core/*.js
LIB = node_modules/es6-promise/dist/*[0-9].js

all: freedom.js

freedom.js: $(LIB) $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/util/preamble.js $(LIB) $(SOURCES) src/util/postamble.js > $@

clean:
	rm freedom.js
	rm freedom.min.js
	rm *.map
	rm tools/coverage*
	rm -r tools/lcov*

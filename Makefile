SOURCES = src/*.js src/link/*.js src/proxy/*.js interface/*.js providers/core/*.js

all: freedom.js

freedom.js: $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/util/preamble.js $(SOURCES) src/util/postamble.js > $@

clean:
	rm freedom.js
	rm freedom.min.js
	rm tools/coverage*
	rm -r tools/lcov*

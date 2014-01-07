SOURCES = src/*.js src/proxy/*.js interface/*.js providers/*.js

all: freedom.js

freedom.js: src/libs/*.js $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/libs/*.js src/util/preamble.js $(SOURCES) src/util/postamble.js > $@

clean:
	rm freedom.js
	rm freedom.min.js

# Compile freedom.js using the closure service.

SOURCES = src/*.js src/proxy/*.js interface/*.js providers/core/*.js

all: freedom.js

freedom.js: src/libs/*.js $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/libs/*.js src/util/preamble.js $(SOURCES) src/util/postamble.js > $@

demo: freedom.js
	python -m SimpleHTTPServer

clean:
	rm freedom.js
	rm freedom.min.js

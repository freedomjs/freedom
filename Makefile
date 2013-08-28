# Compile freedom.js using the closure service.

SOURCES = src/*.js src/proxy/*.js interface/*.js providers/*.js

all: freedom.js

freedom.js: $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/util/preamble.js $(SOURCES) src/util/postamble.js > $@

demo: freedom.js
	python -m SimpleHTTPServer

clean:
	rm freedom.js
	rm freedom.min.js

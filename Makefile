# Compile freedom.js using the closure service.

SOURCES = src/util.js src/hub.js src/apis.js src/app*.js src/channel.js src/proxy.js src/proxy/*.js providers/*.js src/freedom.js interface/*.js src/managerlink.js

all: freedom.js

freedom.js: $(SOURCES) src/util/preamble.js src/util/postamble.js
	cat src/util/preamble.js $(SOURCES) src/util/postamble.js > $@

demo: freedom.js
	python -m SimpleHTTPServer

clean:
	rm freedom.js
	rm freedom.min.js

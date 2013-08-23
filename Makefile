# Compile freedom.js using the closure service.

SOURCES = src/util.js src/hub.js src/apis.js src/app*.js src/channel.js src/proxy.js src/proxy/*.js providers/*.js src/freedom.js interface/*.js src/managerlink.js

all: freedom.js

freedom.js: freedom.min.js src/util/preamble.js src/util/postamble.js
	cat src/util/preamble.js freedom.min.js src/util/postamble.js > freedom.js

freedom.min.js: $(SOURCES)
ifeq "$(LOCAL)" 'yes'
	cat $(SOURCES) > $@
else
	python tools/build.py $(MAKEFLAGS) -o $@ $(SOURCES)
endif

demo: freedom.js
	python -m SimpleHTTPServer

clean:
	rm freedom.js
	rm freedom.min.js

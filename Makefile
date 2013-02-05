# Compile freedom.js using the closure service.

SOURCES = src/channel.js src/proxy.js src/freedom.js

freedom.js: $(SOURCES)
	python tools/build.py $(MAKEFLAGS) -o $@ $(SOURCES)

# Compile freedom.js using the closure service.

SOURCES = $(wildcard src/*.js)

freedom.js: $(SOURCES)
	python tools/build.py -o $@ $(SOURCES)
SHELL := /bin/bash
BUILDDIR=../build
JSDIR=$(BUILDDIR)/js
LIBDIR=$(JSDIR)/libs

all: html css img templates js libs

init:
	mkdir $(BUILDDIR) 2>/dev/null || true

templates: init templates/main.yate
	mkdir -p $(BUILDDIR)/templates
	for template in templates/main.yate; \
	do \
	    yate $$template > $(BUILDDIR)/$$template.js; \
	done
	rm templates/*.obj

css: init css/*.css
	mkdir -p $(BUILDDIR)/css
	cp css/*.css $(BUILDDIR)/css

libs: init ../libs/*
	mkdir -p $(LIBDIR)
	mkdir -p $(LIBDIR)/jslix/
	cp -R ../libs/jslix/src/* $(LIBDIR)/jslix/
	mkdir -p $(LIBDIR)/cryptojs
	cp -R ../libs/crypto-js-read-only/build/* $(LIBDIR)/cryptojs/
	cp ../libs/js-signals/dist/signals.js $(LIBDIR)/signals.js
	cp ../libs/moment.min.js $(LIBDIR)/moment.min.js
	cp ../libs/yate/lib/runtime.js $(LIBDIR)/yate-runtime.js
	# XXX: will we separate css and images?
	cp -TR ../libs/jQuery-contextmenu/src/ $(LIBDIR)/jQuery-contextmenu
	cp ../libs/jquery.js $(LIBDIR)
	cp ../libs/jquery.transit/jquery.transit.js $(LIBDIR)
	cp ../libs/requirejs/require.js $(LIBDIR)

js: init js/*.js
	mkdir -p $(BUILDDIR)/js
	cp js/*.js $(BUILDDIR)/js
	mkdir -p $(BUILDDIR)/js/view
	cp js/view/*.js $(BUILDDIR)/js/view

html: init index.html
	cp index.html $(BUILDDIR)

img: init img/*
	mkdir -p $(BUILDDIR)/img
	cp -R img/* $(BUILDDIR)/img

clean:
	rm -Rf $(BUILDDIR)

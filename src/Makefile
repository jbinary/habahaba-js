SHELL := /bin/bash
BUILDDIR=../build

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

libs: init libs/*
	mkdir -p $(BUILDDIR)/js/libs
	cp -R libs/jslix/src/ $(BUILDDIR)/js/libs/jslix
	cp -R libs/crypto-js-read-only/build $(BUILDDIR)/js/libs/cryptojs
	cp -R libs/js-signals/dist/signals.js $(BUILDDIR)/js/libs/signals.js
	cp -R libs/moment.min.js $(BUILDDIR)/js/libs/moment.min.js
	cp -R libs/yate/lib/runtime.js $(BUILDDIR)/js/libs/yate-runtime.js

js: init js/*.js
	mkdir -p $(BUILDDIR)/js
	cp js/*.js $(BUILDDIR)/js

html: init index.html
	cp index.html $(BUILDDIR)

img: init img/*
	mkdir -p $(BUILDDIR)/img
	cp img/* $(BUILDDIR)/img

clean:
	rm -Rf $(BUILDDIR)

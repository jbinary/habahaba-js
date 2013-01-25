SHELL := /bin/bash
BUILDDIR=build

all: html css img templates js libs

init:
	mkdir $(BUILDDIR) 2>/dev/null || true

templates: init templates/*.yate
	mkdir -p $(BUILDDIR)/templates
	for template in templates/*.yate; \
	do \
	    yate $$template > $(BUILDDIR)/$$template.js; \
	done

css: init css/*.css
	mkdir -p $(BUILDDIR)/css
	cp css/*.css $(BUILDDIR)/css

libs: init libs/*
	mkdir -p $(BUILDDIR)/js/libs
	cp -R libs/* $(BUILDDIR)/js/libs

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

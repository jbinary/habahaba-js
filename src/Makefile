SHELL := /bin/bash
BUILDDIR=build

all: html css img templates

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

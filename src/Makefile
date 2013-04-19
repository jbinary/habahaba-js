SHELL := /bin/bash
BUILDDIR=$(realpath ..)/build
BUILDDIR_TEMPLATES=$(BUILDDIR)/templates
BUILDDIR_LIBS=$(BUILDDIR)/js/libs
BUILDDIR_CSS=$(BUILDDIR)/css
BUILDDIR_IMAGES=$(BUILDDIR)/img
export BUILDDIR BUILDDIR_TEMPLATES BUILDDIR_LIBS BUILDDIR_CSS\
	   BUILDDIR_IMAGES

.PHONY:
all: templates libs css

templates:
	$(MAKE) -C templates

css: css/*.css
	$(MAKE) -C css

libs:
	$(MAKE) -C ../libs/

js: js/*.js
	mkdir -p $(BUILDDIR)/js
	cp js/*.js $(BUILDDIR)/js

html: index.html
	cp index.html $(BUILDDIR)

img: img/*
	mkdir -p $(BUILDDIR)/img
	cp -R img/* $(BUILDDIR)/img

PHONY += clean
clean:
	$(MAKE) -C templates clean
	$(MAKE) -C ../libs clean
	$(MAKE) -C css clean
	$(MAKE) -C img clean

PHONY += uninstall
uninstall:
	-rm -Rf $(BUILDDIR)

PHONY += _install_init
_install_init:
	-mkdir $(BUILDDIR)

PHONY += install
install: all _install_init
	$(MAKE) -C templates install
	$(MAKE) -C ../libs install
	$(MAKE) -C css install
	$(MAKE) -C img install

PHONY += uninstall
# TODO: this is dirty
uninstall:
	-$(RM) -Rf $(BUILDDIR)

.PHONY:
all: ;

PHONY += clean
clean: ;

$(BUILDDIR_CSS):
	-mkdir $@

PHONY += install
install: $(BUILDDIR_CSS) *.css
	cp *.css $(BUILDDIR_CSS)

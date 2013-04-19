.PHONY: all
all: ;

.PHONY: clean
clean: ;

$(BUILDDIR_IMAGES):
	-mkdir $@

$(BUILDDIR_IMAGES)/*.png: *.png
	-mkdir "$(@D)"
	cp $^ "$(@D)"

.PHONY: install
install: $(BUILDDIR_IMAGES) $(BUILDDIR_IMAGES)/*.png


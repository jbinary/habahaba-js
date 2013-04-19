.PHONY:
all: main.yate.js

.templates_copied.ts: all
	-mkdir $(BUILDDIR_TEMPLATES)
	cp main.yate $(BUILDDIR_TEMPLATES)
	touch $@

main.yate.js: main.yate
	yate $< > $@
	rm *.obj

PHONY += install
install: .templates_copied.ts

PHONY += clean
clean:
	-$(RM) *.js
	-$(RM) .*.ts

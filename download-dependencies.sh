#!/bin/bash
DIR=src/libs

cd $DIR && \
echo "CryptoJS" && \
svn checkout http://crypto-js.googlecode.com/svn/tags/3.1.2/ crypto-js-read-only && \
echo "Done."


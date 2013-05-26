#!/bin/bash
DIR=libs

cd $DIR && \
echo "CryptoJS" && \
svn checkout http://crypto-js.googlecode.com/svn/tags/3.1.2/ crypto-js-read-only && \
wget https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.js -O jquery.js && \
echo "Done."


#!/bin/bash
DIR=libs

cd $DIR && \
echo "CryptoJS" && \
svn checkout http://crypto-js.googlecode.com/svn/tags/3.1.2/ crypto-js-read-only && \
wget https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.js -O jquery.js && \
curl -L http://netcologne.dl.sourceforge.net/project/log4javascript/log4javascript/1.4.6/log4javascript-1.4.6.tar.gz | tar xzfO - log4javascript-1.4.6/log4javascript_uncompressed.js > log4javascript.js &&
curl -L https://github.com/kayahr/jquery-fullscreen-plugin/raw/1.1.4/jquery.fullscreen.js > jquery.fullscreen.js &&
echo "Done."


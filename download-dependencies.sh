#!/bin/bash
DIR=libs

cd $DIR && \
echo "CryptoJS" && \
svn checkout http://crypto-js.googlecode.com/svn/tags/3.1.2/ crypto-js-read-only && \
wget https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.js && \
echo "Done."


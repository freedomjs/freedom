#!/bin/bash

if [ ! -d "jsdoc" ]
then
  curl -O https://nodeload.github.com/jsdoc3/jsdoc/zip/master
  unzip master
  rm master
  mv jsdoc-master jsdoc
fi

cd ..
tools/jsdoc/jsdoc -c tools/jsdoc-conf.json -d tools/doc
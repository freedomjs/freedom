#!/bin/bash

if [ ! -d "jsdoc" ]
then
  curl -O https://nodeload.github.com/jsdoc3/jsdoc/zip/master
  unzip master
  rm master
  mv jsdoc-master jsdoc
fi

cd ..
if [ "$1" = "deploy" ]; then
  git stash save temp
  tools/jsdoc/jsdoc -c tools/jsdoc-conf.json -d tools/doc
  mv tools/doc /tmp/doc-deploy
  git branch -f gh-pages origin/gh-pages  
  git checkout gh-pages
  rm -r tools/doc
  mv /tmp/doc-deploy tools/doc
  git add -f tools/doc
  git commit -m "Updated Docs"
  git push origin gh-pages
  git checkout master
  git stash pop

else
  tools/jsdoc/jsdoc -c tools/jsdoc-conf.json -d tools/doc
fi

#!/bin/bash
# Get The locations that the current checked-out version lives.
FREEDOM="https://github.com/freedomjs/freedom/commit"
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git name-rev --name-only HEAD | cut -d "/" -f3)
TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)

git clone git@github.com:freedomjs/freedomjs.github.io.git tools/freedomjs
mkdir -p tools/freedomjs/release/$BRANCH
cp freedom.js tools/freedomjs/release/$BRANCH/freedom.latest.js
cp freedom.min.js tools/freedomjs/release/$BRANCH/freedom.latest.min.js

mkdir -p tools/freedomjs/docs/$BRANCH
rm -rf tools/freedomjs/docs/$BRANCH/*
cp -r tools/doc tools/freedomjs/docs/$BRANCH

mkdir -p tools/freedomjs/demo/$BRANCH
rm -rf tools/freedomjs/demo/$BRANCH/demo
cp -r demo tools/freedomjs/demo/$BRANCH/demo
rm -rf tools/freedomjs/demo/$BRANCH/providers
cp -r providers tools/freedomjs/demo/$BRANCH/providers
cp freedom.js tools/freedomjs/demo/$BRANCH/freedom.js

if [ "$TAG" ]; then
  cp freedom.js tools/freedomjs/release/$BRANCH/freedom.$TAG.js
  cp freedom.min.js tools/freedomjs/release/$BRANCH/freedom.$TAG.min.js
fi

cd tools/freedomjs
git add .
git commit -m $FREEDOM/$COMMIT
git push origin master

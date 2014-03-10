#!/bin/bash
# Get The locations that the current checked-out version lives.
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TAG=$(git describe --tags HEAD 2>/dev/null)

git clone git@github.com:freedomjs/freedomjs.github.io.git tools/freedomjs
mkdir -p tools/freedomjs/release/$BRANCH
cp freedom.js tools/freedomjs/release/$BRANCH/freedom.latest.js
cp freedom.min.js tools/freedomjs/release/$BRANCH/freedom.latest.min.js

mkdir -p tools/freedomjs/docs/$BRANCH
cp -r tools/doc tools/freedomjs/docs/$BRANCH

mkdir -p tools/freedomjs/demo/$BRANCH
cp -r demo tools/freedomjs/demo/$BRANCH/demo
cp -r providers tools/freedomjs/demo/$BRANCH/providers
cp freedom.js tools/freedomjs/demo/$BRANCH/freedom.js

if [ "$TAG" ]; then
  cp freedom.js tools/freedomjs/release/$BRANCH/freedom.$TAG.js
  cp freedom.min.js tools/freedomjs/release/$BRANCH/freedom.$TAG.min.js
fi

cd tools/freedomjs
git add .
git commit -m $COMMIT
git push origin master
#!/bin/bash
# Get The locations that the current checked-out version lives.
FREEDOMCR="https://github.com/freedomjs/freedom/commit"
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git name-rev --name-only HEAD | cut -d "/" -f3)
TAG=$(git describe --abbrev=0 --tags)
#TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)

# Clone
rm -rf tools/freedomjs
git clone git@github.com:freedomjs/freedomjs.github.io.git tools/freedomjs

# Copy latest release
mkdir -p tools/freedomjs/dist/freedom/$TAG
cp freedom.js tools/freedomjs/dist/freedom/$TAG/freedom.$TAG.js
cp freedom.js.map tools/freedomjs/dist/freedom/$TAG/freedom.$TAG.js.map
cp freedom.min.js tools/freedomjs/dist/freedom/$TAG/freedom.$TAG.min.js
cp freedom.min.js.map tools/freedomjs/dist/freedom/$TAG/freedom.$TAG.min.js.map
ln -s freedom.$TAG.js tools/freedomjs/dist/freedom/$TAG/freedom.js
ln -s freedom.$TAG.js.map tools/freedomjs/dist/freedom/$TAG/freedom.js.map
ln -s freedom.$TAG.min.js tools/freedomjs/dist/freedom/$TAG/freedom.min.js
ln -s freedom.$TAG.min.js.map tools/freedomjs/dist/freedom/$TAG/freedom.min.js.map

# Copy docs
mkdir -p tools/freedomjs/dist/freedom/$TAG
rm -rf tools/freedomjs/dist/freedom/$TAG/doc
cp -r tools/doc tools/freedomjs/dist/freedom/$TAG/doc

# Copy demos
mkdir -p tools/freedomjs/dist/freedom/$TAG
rm -rf tools/freedomjs/dist/freedom/$TAG/demo
cp -r demo tools/freedomjs/dist/freedom/$TAG/demo
rm -rf tools/freedomjs/dist/freedom/$TAG/providers
cp -r providers tools/freedomjs/dist/freedom/$TAG/providers

# Link to the latest
rm -f tools/freedomjs/dist/freedom/latest
ln -s $TAG tools/freedomjs/dist/freedom/latest

#if [ "$TAG" ]; then
#  cp freedom.js tools/freedomjs/release/$BRANCH/freedom.$TAG.js
#  cp freedom.min.js tools/freedomjs/release/$BRANCH/freedom.$TAG.min.js
#fi

# Commit
cd tools/freedomjs
git add -A .
git commit -m $FREEDOMCR/$COMMIT
git push origin master


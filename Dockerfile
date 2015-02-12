# Dockerfile for freedom.js
FROM selenium/node-chrome
MAINTAINER Raymond Cheng <ryscheng@cs.washington.edu>

USER root

RUN apt-get update -qqy
RUN apt-get install -qqy software-properties-common
RUN add-apt-repository -y ppa:mozillateam/firefox-next
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN apt-get update -qqy
RUN apt-get -qqy install \
      nodejs \
      git \
      xvfb \
      xfonts-100dpi \
      xfonts-75dpi \
      xfonts-scalable \
      xfonts-cyrillic \
      firefox
RUN npm install -g grunt-cli

ADD . /freedom
WORKDIR /freedom
RUN npm install

ENV DISPLAY :10

# Dockerfile for freedom.js
FROM ubuntu:trusty
MAINTAINER Raymond Cheng <ryscheng@cs.washington.edu>

USER root

ENV DISPLAY :10
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

RUN apt-get update -qqy
RUN apt-get install -qqy software-properties-common wget
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
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
      firefox \
      google-chrome-beta

COPY tasks/scripts/chrome_launcher.sh /opt/google/chrome-beta/google-chrome-beta
RUN chmod +x /opt/google/chrome-beta/google-chrome-beta

RUN npm install -g grunt-cli

ADD . /freedom
WORKDIR /freedom
RUN npm install


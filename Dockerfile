# Dockerfile for freedom.js
FROM ubuntu:trusty
MAINTAINER Raymond Cheng <ryscheng@cs.washington.edu>

USER root

ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true
RUN apt-get update -qqy
RUN apt-get install -qqy wget software-properties-common
RUN add-apt-repository -y ppa:mozillateam/firefox-next
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list
RUN apt-get update -qqy
RUN apt-get -qqy install \
      nodejs \
      git \
      xvfb \
      firefox \
      google-chrome-beta
RUN npm install -g grunt-cli

ADD . /freedom
WORKDIR /freedom
RUN npm install

ENV DISPLAY :10

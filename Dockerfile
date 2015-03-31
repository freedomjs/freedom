# Dockerfile for freedom.js
FROM ubuntu:trusty
MAINTAINER Raymond Cheng <ryscheng@cs.washington.edu>
USER root

# Environment Variables
ENV DISPLAY :10
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

# Add additional package sources (Chrome Beta, Firefox-Next, node.js 0.12, io.js 1.x)
RUN apt-get update -qqy
RUN apt-get install -qqy software-properties-common wget curl
RUN curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

# Firefox beta (37) has weird XHR behavior
# RUN add-apt-repository -y ppa:mozillateam/firefox-next

# Mutually exclusive with Node 0.12
# RUN curl -sL https://deb.nodesource.com/setup_iojs_1.x | sudo bash -
# RUN apt-get -qqy install iojs

# This needs to be run, or the apt-get install will fail
RUN apt-get update -qqy

# apt-get
RUN apt-get -qqy install \
      nodejs \
      xvfb \
      x11vnc \
      xfonts-100dpi \
      xfonts-75dpi \
      xfonts-scalable \
      xfonts-cyrillic \
      firefox \
      google-chrome-beta

# Patch the Chrome launcher to turn off sandboxing
COPY tasks/scripts/chrome_launcher.sh /opt/google/chrome-beta/google-chrome-beta
RUN chmod +x /opt/google/chrome-beta/google-chrome-beta

# npm
RUN npm install -g grunt-cli
RUN npm install -g gulp
RUN npm install -g bower

# Add the freedom repository
ADD . /freedom
WORKDIR /freedom
RUN npm install


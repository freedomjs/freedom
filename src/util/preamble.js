/**
 * This is freedom.js. - https://freedomjs.org
 *
 * Copyright 2013 The freedom.js authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * @license apache2.0
 * @see https://freedomjs.org
 */

var providers = [
  require('../../providers/core/core.unprivileged'),
  require('../../providers/core/echo.unprivileged'),
  require('../../providers/core/logger.console'),
  require('../../providers/core/oauth'),
  require('../../providers/core/peerconnection.unprivileged'),
  require('../../providers/core/storage.localstorage'),
  require('../../providers/core/view.unprivileged'),
  require('../../providers/core/websocket.unprivileged')
];

if (typeof window !== 'undefined') {
  window.freedom = require('../entry').bind({}, {
    location: window.location.href,
    portType: require('../link/worker'),
    // Works in Chrome
    source: window.document.head.lastChild.src,
    providers: providers
  });
} else {
  require('../entry')({
    isModule: true,
    portType: require('../link/worker'),
    providers: providers
  });
}
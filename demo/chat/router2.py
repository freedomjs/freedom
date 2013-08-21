#!/usr/bin/env python
"""
 Websocket rendezvous point.
"""
import os, sys, inspect
here = os.path.abspath(os.path.split(inspect.getfile(inspect.currentframe()))[0])
if os.path.join(here, "tornado") not in sys.path:
  sys.path.insert(0, os.path.join(here, "tornado"))

import tornado.escape
import tornado.ioloop
import tornado.websocket
import tornado.web
import uuid

class Application(tornado.web.Application):
  def __init__(self):
    handlers = [(r"/route", MainHandler)]
    settings = dict( autoescape=None )
    tornado.web.Application.__init__(self, handlers, **settings)

class MainHandler(tornado.websocket.WebSocketHandler):
  waiters = dict()
  sites = dict()

  def allow_draft76(self):
    return True

  def open(self):
    print "Open!"
    self.id = str(uuid.uuid4())
    self.state = 0
    ref = self.request.headers.get("Origin")
    self.sites = [ref]
    MainHandler.waiters[self.id] = self
    if not ref in MainHandler.sites:
      MainHandler.sites[ref] = []
    MainHandler.sites[ref].append(self.id)
    self.write_message({
      'id': self.id,
      'site':ref,
      'from':0,
      'msg':MainHandler.sites[ref]
    });

  def on_finish(self):
    self.on_close()

  def on_close(self):
    if self.id:
      for key in self.sites:
        MainHandler.sites[key].remove(self.id)
      del MainHandler.waiters[self.id]

  def on_message(self, msg):
    if self.state == 0:
      self.state = 1
    val = tornado.escape.json_decode(msg)
    val['from'] = self.id
    for s in self.sites:
          val['site'] = s
          if 'to' in val:
            if val['to'] in MainHandler.sites[s]:
              MainHandler.waiters[val['to']].write_message(val)
          else:
            for u in MainHandler.sites[s]:
              if u != self.id:
                MainHandler.waiters[u].write_message(val)

def main():
  app = Application()
  app.listen(8082)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  main()

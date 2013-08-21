#!/usr/bin/env python
"""
Websocket rendezvous point.
Listens on http://localhost:8082/route
  Depends on python-tornado

Send messages to server to be broadcast to all connected clients from the same origin
  unless 'to' attribute is populated - then directed to just that client
 
Received messages
  On connect: {id: string, site: string, from: int, msg: [connecteduserids]}
  On message: {from: string, site: string, ...}
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
    handlers = [(r"/route/([a-zA-Z0-9_]*)", MainHandler)]
    #handlers = [(r"/route", MainHandler)]
    settings = dict( autoescape=None )
    tornado.web.Application.__init__(self, handlers, **settings)

class MainHandler(tornado.websocket.WebSocketHandler):
  waiters = dict()  #userid => {id: string, state: int, sites: [origins]}
  sites = dict()    #origin => [userids]

  def allow_draft76(self):
    return True

  #def open(self):
  #  self.setup(self.request.headers.get("Origin"))
  
  def open(self, app_id):
    if (app_id == None or app_id == ''):
      app_id = self.request.headers.get("Origin")
    self.setup(app_id)
    
  def setup(self, site):
    print "Open "+site
    self.id = str(uuid.uuid4())
    self.state = 0
    self.sites = [site]
    MainHandler.waiters[self.id] = self
    if not site in MainHandler.sites:
      MainHandler.sites[site] = []
    MainHandler.sites[site].append(self.id)
    self.write_message({
      'id': self.id,
      'site':site,
      'from':0,
      'msg':MainHandler.sites[site]
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

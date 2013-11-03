#!/usr/bin/env python
"""
Websocket rendezvous point.
Listens on http://localhost:8082/route
  Depends on python-tornado

Send messages to server to be broadcast to all connected clients from the same origin
  unless 'to' attribute is populated - then directed to just that client
 
Received messages
  On initial connection: {cmd: "state", id: string, site: string, msg: [connecteduserids]}
  On message: {cmd: "message", from: string, site: string, ...}
  On roster change: {cmd: "roster", id: string, online: boolean}
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
  waiters = dict()  #userid => WebSocketHandler
  sites = dict()    #origin => [userids]

  def allow_draft76(self):
    return True

  #def open(self):
  #  self.setup(self.request.headers.get("Origin"))
  
  def open(self, app_id):
    if (app_id == None or app_id == ''):
      app_id = self.request.headers.get("Origin")
    self.setup(app_id)
    
  # Setup a new connection
  def setup(self, site):
    print "Open " + site
    self.id = str(uuid.uuid4())
    self.sites = [site]
    # Store this connection
    MainHandler.waiters[self.id] = self
    # Add client to global list
    if not site in MainHandler.sites:
      MainHandler.sites[site] = []
    MainHandler.sites[site].append(self.id)
    # Send initial state to client
    self.write_message({
      'cmd': "state",
      'id': self.id,
      'site':site,
      'msg':MainHandler.sites[site]
    });
    # Broadcast this guy is alive
    for user in MainHandler.sites[site]:
      MainHandler.waiters[user].write_message({
        'cmd': "roster",
        'id': self.id,
        'online': True
      });

  def on_finish(self):
    self.on_close()
  
  # Close connection
  def on_close(self):
    if self.id:
      # Cleanup global state
      for key in self.sites:
        MainHandler.sites[key].remove(self.id)
      del MainHandler.waiters[self.id]
    # Broadcast user has left
    if self.id and self.sites:
      for site in self.sites:
        for user in MainHandler.sites[site]:
          MainHandler.waiters[user].write_message({
            'cmd': "roster",
            'id': self.id,
            'online': False
          });

  # On incoming message
  def on_message(self, msg):
    val = tornado.escape.json_decode(msg)
    val['cmd'] = "message";
    val['from'] = self.id

    # Check across all sites
    for s in self.sites:
      val['site'] = s
      # If recipient is specified, find that connection
      if 'to' in val:
        if val['to'] in MainHandler.sites[s]:
          MainHandler.waiters[val['to']].write_message(val)
      # If no recipient, broadcast to all in that site
      else:
        for u in MainHandler.sites[s]:
          if u != self.id:
            MainHandler.waiters[u].write_message(val)

def main():
  port = 8082
  print "Listening on " + str(port) 
  app = Application()
  app.listen(port)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  main()

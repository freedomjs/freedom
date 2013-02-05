#!/usr/bin/python2.4

from optparse import OptionParser
import json
import httplib, urllib
import sys

parser = OptionParser()
parser.add_option("-o", "--out", dest="filename",
    help="write output to FILE", metavar="FILE")

(options, files) = parser.parse_args()

data = ''
for file in files:
  data += open(file).read()

params = urllib.urlencode([
    ('js_code', data),
    ('compilation_level', 'ADVANCED_OPTIMIZATIONS'),
    ('output_format', 'json'),
    ('output_info', 'errors'),
    ('formatting', 'pretty_print')
  ])

headers = { "Content-type": "application/x-www-form-urlencoded" }
conn = httplib.HTTPConnection('closure-compiler.appspot.com')
conn.request('POST', '/compile', params, headers)
response = conn.getresponse()
resp = json.loads(response.read())
if "errors" in resp:
  print(json.dumps(resp['errors'], indent=2))
  sys.exit(1)
else:
  code = resp['compiledCode']
  if options.filename:
    open(options.filename, 'w').write(code)
  else:
    print code
conn.close()
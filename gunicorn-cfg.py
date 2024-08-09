# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

bind = '0.0.0.0:5005'
workers = 5 #The suggested number of workers is (2*CPU)+1
threads = 2
timeout = 1200
accesslog = '-'
loglevel = 'production'
certfile = '/crt/cert.pem'
keyfile = '/crt/key.pem'
capture_output = True
enable_stdio_inheritance = True

#bind = '0.0.0.0:5005'
#workers = 1
#accesslog = '-'
#loglevel = 'debug'
#capture_output = True
#enable_stdio_inheritance = True

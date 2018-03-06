#!/usr/bin/env python3

from flask import Flask
from flask_cors import CORS

import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__, static_url_path='/static')
CORS(app)

import web.endpoints

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
handler = RotatingFileHandler('controller.log', maxBytes=10000, backupCount=1)
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

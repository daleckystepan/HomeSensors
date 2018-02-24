from web import app

from flask import send_from_directory
from flask import render_template
from flask import session
from flask import request

import uuid
from collections import deque
from tinydb import TinyDB, Query

serialBuffer = deque([], 100)
serialCommand = deque([])
db = TinyDB('db.json')

import re
from datetime import datetime

pattern = re.compile(r"""DATA:
                            \ S:\ (?P<source>\d+)
                            \ R:\ (?P<rssi>-?\d+)
                            \ RT:\ (?P<radiotemp>\d+)
                            \ T:\ (?P<temp>(\d)+\.(\d+))
                            \ H:\ (?P<hum>(\d)+\.(\d+))
                            \ L:\ (?P<light>\d+)""",re.VERBOSE)

@app.route('/')
def index():
    if not 'id' in session:
        session['id'] = uuid.uuid4();
    table = db.table('nodes')
    nodes = table.all()
    nodes.sort(key=lambda x: x['id'])
    return render_template('index.html', id=session['id'], nodes=nodes)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/serial/', methods=['POST'])
def serialPost():
    data = request.get_json()
    line = data.get('line')
       
    serialBuffer.append(line)
    
    match = pattern.match(line)
    if match:
        table = db.table('nodes')
        id = match.group("source")
        source = match.group("source")
        rssi = match.group("rssi")
        radiotemp = match.group("radiotemp")
        temp = float(match.group("temp"))
        hum = float(match.group("hum"))
        light = match.group("light")
        
        dt = datetime.now().strftime("%d. %m. %Y %H:%M:%S")
        
        User = Query()
        table.upsert({'id': id, 'datetime': dt, 'rssi': rssi, 'radiotemp': radiotemp, 'temp': temp, 'humidity': hum, 'light': light}, User.id == id)
        
        data = []
        if len(serialCommand):
            data = serialCommand.pop()
    
    return render_template('serialPost.json', data=data)

@app.route('/serial/', methods=['GET'])
def serialGet():
    return render_template('serialGet.json', lines=list(serialBuffer))

@app.route('/network/')
def network():
    table = db.table('nodes')
    data = table.all()
    return render_template('network.json', nodes=data)

@app.route('/node/<int:id>/<string:fce>/')
def node(id, fce):
    serialCommand.append({'id': id, 'fce': fce})
    return ('', 204)

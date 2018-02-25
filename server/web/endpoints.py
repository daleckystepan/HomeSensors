from web import app

from flask import send_from_directory
from flask import render_template
from flask import session
from flask import request

import uuid
from collections import deque
from tinydb import TinyDB, Query

serialBuffer = deque([], 100)
tasks = deque([])
db = TinyDB('db.json')

from parser import Parser
from datetime import datetime


@app.route('/')
def index():
    if not 'id' in session:
        session['id'] = uuid.uuid4();
    table = db.table('nodes')
    nodes = table.all()
    nodes.sort(key=lambda x: x['node'])
    return render_template('index.html', id=session['id'], nodes=nodes)


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


@app.route('/serial/', methods=['POST'])
def serialPost():
    line = request.get_json()
    serialBuffer.append(line)
    
    json = Parser.serialToJson(line)
    
    data = []
    
    if json:
        json['datetime'] = datetime.now().strftime("%d. %m. %Y %H:%M:%S")
        
        table = db.table('nodes')
        Node = Query()
        table.upsert(json, Node.node == json['node'])
        
        if len(tasks):
            data = tasks.pop()
    
    return render_template('serialPost.json', data=data)


@app.route('/serial/', methods=['GET'])
def serialGet():
    return render_template('serialGet.json', lines=list(serialBuffer))


@app.route('/tasks/')
def tasksGet():
    return render_template('serialPost.json', data=list(tasks))


@app.route('/network/')
def network():
    table = db.table('nodes')
    data = table.all()
    return render_template('network.json', nodes=data)


@app.route('/node/<int:node>/<string:cmd>/')
def node(node, cmd):
    tasks.append({'node': node, 'cmd': cmd, 'uuid': uuid.uuid4()})
    return ('', 204)

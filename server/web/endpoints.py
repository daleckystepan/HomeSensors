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
db.table('tasks').purge()

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


@app.route('/serial', methods=['POST'])
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
            uuid = tasks.pop()
            table = db.table('tasks')
            Task = Query()
            data = table.search(Task.uuid == uuid)
            table.remove(None, [data[0].doc_id])

    return render_template('data.json', data=data)


@app.route('/serial', methods=['GET'])
def serialGet():
    return render_template('data.json', data=list(serialBuffer))


@app.route('/tasks')
def tasksGet():
    table = db.table('tasks')
    data = table.all()
    return render_template('data.json', data=data)


@app.route('/task/<string:uuid>')
def task(uuid):
    table = db.table('tasks')
    Task = Query()
    data = table.search(Task.uuid == uuid)

    if len(data):
        data = data[0]

    return render_template('data.json', data=data)


@app.route('/network')
def network():
    table = db.table('nodes')
    data = table.all()
    return render_template('data.json', data=data)


@app.route('/node/<string:node>')
def node(node):
    table = db.table('nodes')
    Node = Query()
    data = table.search(Node.node == node)

    if len(data):
        data = data[0]

    cmd = request.args.get('cmd')
    if cmd:
        print("Create tasks")
        t = {'node': node, 'cmd': cmd, 'uuid': str(uuid.uuid4())}
        table = db.table('tasks')
        table.insert(t)
        tasks.append(t['uuid'])

    return render_template('data.json', data=data)

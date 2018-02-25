#!/usr/bin/env python3

from multiprocessing import Process, Pipe

def mainSerial(prometheus_pipe):
    print("Serial")
    import serial
    import select
    import requests
    import json
    ser = serial.Serial('/dev/ttyUSB0', 9600)

    # Sockets from which we expect to read
    inputs = [ ser ]

    # Sockets to which we expect to write
    outputs = []

    headers = {'Content-type': 'application/json'}

    while inputs:
        readable, writable, exceptional = select.select(inputs, outputs, inputs)

        for s in readable:
            if s == ser:
                line = ser.readline().decode('ascii').strip()
                prometheus_pipe.send(line)
                r = requests.post('http://localhost:8080/serial', headers=headers, data = json.dumps(line))
                jsn = json.loads(r.text)
                if jsn:
                    print("SerialCommand: {}".format(jsn))


def mainFlask():
    from web import app
    print("Flask")
    app.run(host="0.0.0.0", port=8080)


def mainPrometheus(pipe):
    print("Prometheus")
    from prometheus_client import start_http_server, Gauge
    from parser import Parser

    start_http_server(8000)

    r = Gauge('rssi', 'RSSI', ['room'])
    t = Gauge('temperature', 'Temperature', ['room'])
    h = Gauge('humidity', 'Humidity', ['room'])
    l = Gauge('light', 'Light', ['room'])
    rt = Gauge('radiotemp', 'RadioTemperature', ['room'])

    while True:
        line = pipe.recv()

        json = Parser.serialToJson(line)

        if json:
            r.labels(room=json['node']).set(json['rssi'])
            rt.labels(room=json['node']).set(json['radiotemp'])
            t.labels(room=json['node']).set(json['temp'])
            h.labels(room=json['node']).set(json['humidity'])
            l.labels(room=json['node']).set(json['light'])

if __name__ == '__main__':
    print("main-start");

    pList = []

    prometheus_serial_pipe, serial_prometheus_pipe = Pipe()

    p = Process(target=mainSerial, args=(serial_prometheus_pipe,))
    pList.append(p)
    p.start()

    p = Process(target=mainFlask)
    pList.append(p)
    p.start()

    p = Process(target=mainPrometheus, args=(prometheus_serial_pipe,))
    pList.append(p)
    p.start()

    for p in pList:
      p.join()

    print("main-end")

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
                r = requests.post('http://localhost:8080/serial/', headers=headers, data = json.dumps({'line':line}))
                print("Response: {}".format(r.text))
    

def mainFlask():
    from web import app
    print("Flask")
    app.run(host="0.0.0.0", port=8080)
    
    
def mainPrometheus(pipe):
    print("Prometheus")
    from prometheus_client import start_http_server, Gauge
    import re
    
    pattern = re.compile(r"""DATA:
                                \ S:\ (?P<source>\d+)
                                \ R:\ (?P<rssi>-?\d+)
                                \ RT:\ (?P<radiotemp>\d+)
                                \ T:\ (?P<temp>(\d)+\.(\d+))
                                \ H:\ (?P<hum>(\d)+\.(\d+))
                                \ L:\ (?P<light>\d+)""",re.VERBOSE)
    
    r = Gauge('rssi', 'RSSI', ['room'])
    t = Gauge('temperature', 'Temperature', ['room'])
    h = Gauge('humidity', 'Humidity', ['room'])
    l = Gauge('light', 'Light', ['room'])
    rt = Gauge('radiotemp', 'RadioTemperature', ['room'])
    start_http_server(8000)
    
    while True:
        line = pipe.recv()
        print(line)
        match = pattern.match(line)
        
        if match: 
            source = match.group("source")
            rssi = match.group("rssi")
            radiotemp = match.group("radiotemp")
            temp = float(match.group("temp"))
            hum = float(match.group("hum"))
            light = match.group("light")
            
            print('Source: {} Rssi: {} RadioTemp: {} Temp: {} Hum: {} Light: {}'.format(source, rssi, radiotemp, temp, hum, light))
            r.labels(room=source).set(rssi)
            rt.labels(room=source).set(radiotemp)
            t.labels(room=source).set(temp)
            h.labels(room=source).set(hum)
            l.labels(room=source).set(light)
    
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

import re

class Parser:

    pattern = re.compile(r"""DATA:
                            \ S:\ (?P<source>\d+)
                            \ R:\ (?P<rssi>-?\d+)
                            \ RT:\ (?P<radiotemp>\d+)
                            \ T:\ (?P<temp>(\d)+\.(\d+))
                            \ H:\ (?P<humidity>(\d)+\.(\d+))
                            \ L:\ (?P<light>\d+)""",re.VERBOSE)
    @classmethod
    def serialToJson(cls, line):
        match = cls.pattern.match(line)
        ret = {}
        if match: 
            node = match.group("source")
            rssi = match.group("rssi")
            radiotemp = match.group("radiotemp")
            temp = float(match.group("temp"))
            humidity = float(match.group("humidity"))
            light = match.group("light")
            
            ret = {'node': node, 'rssi': rssi, 'radiotemp': radiotemp, 'temp': temp, 'humidity': humidity, 'light': light}
        
        return ret

    @classmethod
    def jsonToSerial(cls, json):
        return "Zatim nic"

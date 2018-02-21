# HomeSensors
Home Sensors based on Arduino

* All libraries can be downloaded using built-in arduino library manager or fetched from github

## Architecture
* All nodes can comunicate with others using RFM69 wireless modules. Communiction is encrypted using AES.
* One master node with NodeID = 0 only listen to packets and send them through Serial to computer
* NodeID and NewtorkID can be set (and must be set) in EEPROM

## Hardware:
All of them are cheap and can be bought easily on Ebay. 

* Arduino Pro Mini ATmega 328p 3.3V 8MHZ
* Wireless communication RFM69
  * https://github.com/LowPowerLab/RFM69 (delete OTA files if compilation faild due to SPIFlash error)
* OLED display I2C 128x64
  * U8g2lib
* Temperature and Humidity Sensor HDC1080
  * ClosedCube HDC080
* Light sensor TSL2561
  * Adafruit TSL2561 with Adafruit Unified Sensor Library

## Installation
* Clone repo
* Get all libraries
* Change ENCRYPTKEY to your needs - must be 16 characters
* Wire the arduino with sensors and other components
* Flash it

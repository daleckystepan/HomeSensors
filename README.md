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
  * https://github.com/LowPowerLab/RFM69
  * Delete RFM69_OTA.* files if compilation faild due to SPIFlash error
* OLED display I2C 128x64
  * U8g2lib
  * https://github.com/olikraus/u8g2
* Temperature and Humidity Sensor HDC1080
  * ClosedCube HDC1080
  * https://github.com/closedcube/ClosedCube_HDC1080_Arduino
* Light sensor TSL2561
  * Adafruit TSL2561 with Adafruit Unified Sensor Library
  * https://github.com/adafruit/TSL2561-Arduino-Library
  * https://github.com/adafruit/Adafruit_Sensor

## Installation
* Clone repo
* Get all libraries
* Change ENCRYPTKEY to your needs - must be 16 characters
* Wire the arduino with sensors and other components
* Flash it

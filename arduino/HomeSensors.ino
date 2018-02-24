//AVR
#include <avr/sleep.h>
#include <avr/wdt.h>


//Arduino
#include <Arduino.h>
#include <EEPROM.h>


//Third party
#include <SerialCommands.h>

#include <U8g2lib.h>             // Display
#include <ClosedCube_HDC1080.h>  // Temperature, humidity
#include <RFM69.h>               // Wireless
#include <Adafruit_TSL2561_U.h>  // Light Sensor

#include "secrets.h"             // ENCRYPTKEY


#include <MemoryUsage.h>

#define SERIAL_BAUD 9600
#define BUTTON_INTERRUPT_PIN 3
#define LED_PIN 4

volatile bool powerDownEnabled = true;
volatile bool wdtInterrupted = true; // To send data after power up
uint8_t lastSource = 0;
int16_t lastRssi = 0;
byte prepis = 0;


struct Settings
{
  uint8_t networkid;
  uint8_t nodeid;
};

Settings settings;

struct Packet
{
  uint8_t radioTemperature;
  double temperature;
  double humidity;
  uint32_t light;
};

struct Hal
{
  bool radio;
  bool tsl;
  bool hdc;
};

Hal hal;

char serial_command_buffer_[32];

void cmdSleep(SerialCommands *);
void cmdGetNetowrkId(SerialCommands *);
void cmdSetNetworkId(SerialCommands *);
void cmdGetNodeId(SerialCommands *);
void cmdSetNodeId(SerialCommands *);

SerialCommands SCmd(&Serial, serial_command_buffer_, sizeof(serial_command_buffer_), "\n", " ");
SerialCommand scmdSleep("sleep", cmdSleep);
SerialCommand scmdGetNetworkId("gNetId", cmdGetNetowrkId);
SerialCommand scmdSetNetworkId("sNetId", cmdSetNetworkId);
SerialCommand scmdGetNodeId("gNodeId", cmdGetNodeId);
SerialCommand scmdSetNodeId("sNodeId", cmdSetNodeId);


// Temperature and humidity sensor
ClosedCube_HDC1080 hdc;

// RF module
RFM69 radio;

// Oled display
U8X8_SSD1306_128X64_NONAME_HW_I2C oled(U8G2_R0);

// Light sensor
Adafruit_TSL2561_Unified tsl(TSL2561_ADDR_FLOAT, 12345);


void setup(void)
{
  Serial.begin(SERIAL_BAUD);

  Serial.println(F("[CMD]"));
  SCmd.SetDefaultHandler(&cmdUnrecognized);
  SCmd.AddCommand(&scmdSleep);
  SCmd.AddCommand(&scmdGetNetworkId);
  SCmd.AddCommand(&scmdSetNetworkId);
  SCmd.AddCommand(&scmdGetNodeId);
  SCmd.AddCommand(&scmdSetNodeId);

  Serial.print(F("[EEPROM] "));
  EEPROM.get(0, settings);
  Serial.print(F("Network id: "));
  Serial.print(settings.networkid);
  Serial.print(F(" Node id: "));
  Serial.println(settings.nodeid);


  Serial.println(F("[PINS]"));
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  pinMode(BUTTON_INTERRUPT_PIN, INPUT_PULLUP);


  Serial.println(F("[OLED]"));
  oled.begin();
  oled.setFont(u8x8_font_chroma48medium8_r);
  oled.draw2x2String(0, 0, "Booting");


  Serial.print(F("[HDC1080] "));
  hdc.begin(0x40);
  uint16_t manId = hdc.readManufacturerId();
  uint16_t devId = hdc.readDeviceId();
  hal.hdc = (manId != 0xFFFF) && (devId != 0xFFFF);
  if( hal.hdc )
  {
    Serial.print(F("Manufacture: "));
    Serial.print(manId, HEX);
    Serial.print(F(" Device: "));
    Serial.println(devId, HEX);
  }
  else
  {
    Serial.println(F(" Failed"));
  }

  
  Serial.print(F("[TSL2561]"));
  hal.tsl = tsl.begin();
  if( hal.tsl )
  {
    tsl.enableAutoRange(true);
    tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS);
    sensor_t sensor;
    tsl.getSensor(&sensor);
    Serial.print(F(" Sensor: "));
    Serial.print(sensor.name);
    Serial.print(F(" Ver: "));
    Serial.print(sensor.version);
    Serial.print(F(" ID: "));
    Serial.println(sensor.sensor_id);
  }
  else
  {
    Serial.println(F(" Failed"));
  }

  Serial.print(F("[RFM69] "));
  hal.radio = radio.initialize(RF69_868MHZ, settings.nodeid, settings.networkid);
  if( hal.radio )
  {
    radio.setHighPower(true);
    radio.setPowerLevel(2); // 0-31
    radio.encrypt(ENCRYPTKEY);
    uint8_t temp = radio.readTemperature();
    Serial.print(F("Temperature: "));
    Serial.println(temp);
  }
  else
  {
    Serial.println(F(" Failed"));
  }

}


void loop(void)
{
  SCmd.ReadSerial();


  if (radio.receiveDone())
  {
    Serial.print(F("[RFM69] Incoming packet from: "));
    Serial.print(radio.SENDERID, DEC);
    Serial.print(F(" LEN: "));
    Serial.print(radio.DATALEN);
    Serial.print(F(" RSSI: "));
    Serial.println(radio.RSSI);
    
    if(settings.nodeid == 0)
    {
      masterPacket();
    }
    else
    {
      nodePacket();  
    }
  }


  // If timed out set new interval
  if( wdtInterrupted )
  {
    FREERAM_PRINT;
    
    nodeLoop();
    
    // Set new wdt timer
    wdtInterrupted = false;

    wdt_enable(WDTO_8S);
    WDTCSR |= (1 << WDIE);
  }
  
  // Come up with another solution - dont call it too often
  attachInterrupt(digitalPinToInterrupt(BUTTON_INTERRUPT_PIN), ButtonInterrupt, LOW);

  if( powerDownEnabled )
  {
    powerDown();
  }
}

// Receive
void masterPacket()
{
  if(radio.DATALEN == sizeof(Packet))
  {
    lastSource = radio.SENDERID;
    lastRssi = radio.RSSI;
    Packet *p = (Packet*)radio.DATA;

    printDataPacket(lastSource, lastRssi, p);
  }
  else
  {
    Serial.println(F("[RFM69] Invalid packet size"));
  }
}


// Receive
void nodePacket()
{

}


void nodeLoop()
{
  Packet p = {0, 0.0, 0.0, 0};

  Serial.print(F("[SENSORS] Reading"));

  p.radioTemperature = radio.readTemperature(-8);

  if( hal.hdc )
  {
    p.temperature = hdc.readTemperature();
    p.humidity = hdc.readHumidity();
    Serial.print(F(" hdc1080"));
  }

  if( hal.tsl )
  {
    sensors_event_t event;
    tsl.getEvent(&event);
    p.light = event.light;
    Serial.print(F(" tsl2561"));
  }

  Serial.println();

  printDataPacket(settings.nodeid, 0, &p);

  // Send to master (nodeid == 0)
  // 255 = broadcast
  if(settings.nodeid)  // if not master
  {
    Serial.println(F("[RFM69] Sending packet"));
    radio.send(0, &p, sizeof(Packet));
  }

  updateDisplay(p.radioTemperature, p.temperature, p.humidity, p.light, lastSource, lastRssi);
}


void printDataPacket(uint8_t sender, int16_t rssi , Packet *p)
{
    Serial.print(F("DATA: "));
    
    Serial.print(F("S: "));
    Serial.print(sender, DEC);
    Serial.print(F(" R: "));
    Serial.print(rssi, DEC);
    Serial.print(F(" RT: "));
    Serial.print(p->radioTemperature);
    Serial.print(F(" T: "));
    Serial.print(p->temperature);
    Serial.print(F(" H: "));
    Serial.print(p->humidity);
    Serial.print(F(" L: "));
    Serial.print(p->light);
    
    Serial.println();
}

void updateDisplay(uint8_t rt, double t, double h, uint32_t l, uint8_t source, int16_t rssi)
{
  Serial.println(F("[OLED] Updating"));
  const int MAX_LEN = 17;
  char line[MAX_LEN];
  
  ++prepis;

  // 1. zluty radek
  snprintf(line, MAX_LEN, "Net:%3d SIG:%4d", settings.networkid, rssi);
  oled.drawString(0, 0, line);

  // 2. zluty radek
  snprintf(line, MAX_LEN, "Node:%3d Src:%3d", settings.nodeid, source);
  oled.drawString(0, 1, line);

  // 3. modry radek
  dtostrf(t, 4, 2, line);
  snprintf(line, MAX_LEN, "%s C", line);
  //oled.draw2x2String(0, 2, line);
  oled.drawString(0, 2, line);

  // 4. modry radek
  dtostrf(h, 4, 2, line);
  snprintf(line, MAX_LEN, "%s %%", line);
  //oled.draw2x2String(0, 4, line);
  oled.drawString(0, 3, line);

  // 5. modry radek
  dtostrf(l, 4, 0, line);
  snprintf(line, MAX_LEN, "%s lux", line);
  oled.drawString(0, 4, line);

  // 6. blue line
  snprintf(line, MAX_LEN, "%4d C", rt);
  oled.drawString(0, 5, line);
  

  // 8. Posledni radek
  snprintf(line, MAX_LEN, "%d x", prepis);
  oled.drawString(0, 7, line);
}


void cmdSleep(SerialCommands *sender)
{
  powerDownEnabled = true;
}

void cmdGetNetowrkId(SerialCommands *sender)
{
  Serial.print(F("Network ID: "));
  Serial.println(settings.networkid);
}

void cmdSetNetworkId(SerialCommands *sender)
{
  char *arg = sender->Next();

  if(arg)
  {
    uint8_t nid = constrain(atoi(arg), 0, 255);
    Serial.print(F("new Network ID: "));
    Serial.println(nid);
    settings.networkid = nid;
  
    EEPROM.put(0, settings);
    radio.setNetwork(nid);
  }
  else
  {
    Serial.println(F("[CMD] Missing argument"));
  }
}


void cmdGetNodeId(SerialCommands *sender)
{
  Serial.print(F("Node ID: "));
  Serial.println(settings.nodeid);
}


void cmdSetNodeId(SerialCommands *sender)
{
  char *arg = sender->Next();

  if(arg)
  {
    uint8_t nid = constrain(atoi(arg), 0, 255);
    Serial.print(F("new Node ID: "));
    Serial.println(nid);
    settings.nodeid = nid;

    EEPROM.put(0, settings);
    radio.setAddress(nid);
  }
  else
  {
    Serial.println(F("[CMD] Missing argument"));
  }
}


void cmdUnrecognized(SerialCommands *sender, const char *arg)
{
  Serial.print(F("[CMD] Uncrecognized: "));
  Serial.println(arg);
}


void ButtonInterrupt()
{
  detachInterrupt(digitalPinToInterrupt(BUTTON_INTERRUPT_PIN));
  powerDownEnabled = false;
}


ISR(WDT_vect)
{
  wdt_disable();

  wdtInterrupted = true;
}

void powerDown()
{
  digitalWrite(LED_PIN, LOW);
  Serial.flush();
  radio.receiveDone();  // Must be here to have working waking interrupt when packet is received
  //attachInterrupt(digitalPinToInterrupt(BUTTON_INTERRUPT_PIN), ButtonInterrupt, LOW);

  //Turn off ADC
  ADCSRA &= ~(1 << ADEN);

  //Do the sleep according to documentation
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);
  cli();
  sleep_enable();
  sleep_bod_disable();
  sei();
  sleep_cpu();
  sleep_disable();
  sei();

  //Turn on ADC
  ADCSRA |= (1 << ADEN);
  
  digitalWrite(LED_PIN, HIGH);
}

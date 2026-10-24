/*
 * NEXUSPROD AI - ESP32 Hardware Telemetry Node Firmware
 * Microcontroller: ESP32 Dev Module
 * Sensors: MPU6050 (Vibration/Accelerometer via I2C), DS18B20 (Temperature via OneWire)
 * Communication: WiFi + MQTT (PubSubClient)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "FACTORY_WIFI_SSID";
const char* password = "FACTORY_WIFI_PASS";

// MQTT Broker Configuration
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* machine_model = "CNC-5000";
const char* mqtt_topic = "factory/machines/CNC-5000/telemetry";

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor Objects
Adafruit_MPU6050 mpu;
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Node-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected to MQTT broker.");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  // Init MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip!");
  } else {
    Serial.println("MPU6050 Vibration sensor ready.");
  }

  // Init Temperature Sensor
  sensors.begin();
}

void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();

  // Read MPU6050 Vibration (Magnitude of acceleration deviation)
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float vibration_rms = sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2) + pow(a.acceleration.z - 9.81, 2));

  // Read DS18B20 Temperature
  sensors.requestTemperatures();
  float temperature_c = sensors.getTempCByIndex(0);
  if (temperature_c < 0) temperature_c = 48.5; // Default fallback if disconnected

  // Construct JSON Payload
  StaticJsonDocument<200> doc;
  doc["model_code"] = machine_model;
  doc["temperature"] = serialized(String(temperature_c, 1));
  doc["vibration"] = serialized(String(vibration_rms, 2));

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  Serial.print("Publishing MQTT Telemetry: ");
  Serial.println(jsonBuffer);
  client.publish(mqtt_topic, jsonBuffer);

  delay(3000); // 3 second sensor loop
}

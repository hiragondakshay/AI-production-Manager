"""
NEXUSPROD AI - Raspberry Pi Edge Gateway Telemetry Publisher
Microcontroller / SBC: Raspberry Pi 4 / 5
Protocols: I2C (MPU6050 / DS18B20) -> MQTT Broker (Paho-MQTT)
"""

import time
import json
import random
import paho.mqtt.client as mqtt

BROKER = "broker.hivemq.com"
PORT = 1883
MACHINE_MODEL = "INJ-850T"
TOPIC = f"factory/machines/{MACHINE_MODEL}/telemetry"

def read_hardware_sensors():
    """
    Reads hardware sensor pins or generates edge telemetry.
    In real hardware deployment, replace with smbus2 / adafruit_mpu6050 read calls.
    """
    temp = round(52.0 + random.uniform(-1.5, 2.8), 1)
    vib = round(1.3 + random.uniform(-0.1, 0.4), 2)
    return temp, vib

def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"rpi_gateway_{MACHINE_MODEL}")
    print(f"Connecting Raspberry Pi Gateway to MQTT Broker {BROKER}:{PORT}...")
    client.connect(BROKER, PORT, 60)
    client.loop_start()

    try:
        while True:
            temp, vib = read_hardware_sensors()
            payload = {
                "model_code": MACHINE_MODEL,
                "temperature": temp,
                "vibration": vib
            }
            payload_str = json.dumps(payload)
            print(f"[RPi Edge Node] Publishing telemetry to {TOPIC}: {payload_str}")
            client.publish(TOPIC, payload_str)
            time.sleep(3.0)
    except KeyboardInterrupt:
        print("\nStopping Raspberry Pi Gateway.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()

import json
import os
import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Machine, MachineStatus, Alert, AlertSeverity
from services.websocket_manager import ws_manager

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "factory/machines/+/telemetry"

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"[MQTT] Connected to broker {MQTT_BROKER}:{MQTT_PORT} with result code {rc}")
    client.subscribe(MQTT_TOPIC)
    print(f"[MQTT] Subscribed to topic pattern: {MQTT_TOPIC}")

def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode("utf-8")
        data = json.loads(payload_str)
        model_code = data.get("model_code") or msg.topic.split("/")[-2]
        temp = float(data.get("temperature", 45.0))
        vib = float(data.get("vibration", 1.2))

        db: Session = SessionLocal()
        try:
            m = db.query(Machine).filter(Machine.model_code == model_code).first()
            if m:
                m.temperature = temp
                m.vibration = vib
                
                # Recalculate Health Score based on telemetry
                health = 100.0 - max(0.0, (temp - 45.0) * 1.2) - max(0.0, (vib - 1.2) * 15.0)
                m.health_score = round(max(5.0, min(100.0, health)), 1)

                if temp > 75.0 or vib > 4.5:
                    m.status = MachineStatus.BREAKDOWN.value
                    db.add(Alert(
                        alert_type="maintenance_warning",
                        severity=AlertSeverity.CRITICAL.value,
                        message=f"[MQTT HARDWARE SENSOR ALERT] Critical spike on {m.name}: Temp={temp}°C, Vib={vib}mm/s",
                        source_id=m.model_code
                    ))

                db.commit()

                # Broadcast live payload via WebSockets
                ws_data = {
                    "type": "TELEMETRY_PULSE",
                    "machines": [{
                        "id": m.id,
                        "name": m.name,
                        "status": m.status,
                        "health_score": m.health_score,
                        "temperature": m.temperature,
                        "vibration": m.vibration
                    }]
                }
                # Non-blocking schedule broadcast
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(ws_manager.broadcast(ws_data))
                except Exception:
                    pass
        finally:
            db.close()

    except Exception as e:
        print(f"[MQTT Error] Failed to process message on {msg.topic}: {e}")

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="nexusprod_fastapi_backend")
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

def start_mqtt_client():
    try:
        mqtt_client.connect_async(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print("[MQTT] Background listener started.")
    except Exception as e:
        print(f"[MQTT] Could not connect to broker ({e}). Offline mode active.")

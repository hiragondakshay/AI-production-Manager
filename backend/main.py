import asyncio
import random
import json
import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from services.seed_data import seed_database_if_empty
from services.websocket_manager import ws_manager
from services.mqtt_service import start_mqtt_client, mqtt_client, MQTT_TOPIC
from security import SecurityHeadersMiddleware
from models import Machine, MachineStatus, MachineTelemetry
from services.smart_telemetry import calculate_machine_health, calculate_predictive_risk

# Routers
from routers.auth_router import router as auth_router
from routers.dashboard_router import router as dashboard_router
from routers.machines_router import router as machines_router
from routers.orders_router import router as orders_router
from routers.inventory_router import router as inventory_router
from routers.alerts_router import router as alerts_router
from routers.ai_router import router as ai_router
from routers.reports_router import router as reports_router
from routers.attendance_router import router as attendance_router
from routers.smart_factory_router import router as smart_factory_router
from routers.enterprise_router import router as enterprise_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEXUSPROD AI - Industry 4.0 Smart Factory Platform API",
    description="Unified Enterprise Industry 4.0 Smart Factory API supporting AI Factory Copilot, OEE Analytics, Downtime Pareto, Maintenance Work Orders, What-If Simulation, Energy Monitoring, Production Costs, RCA, and RBAC",
    version="3.5.0"
)

# Enable Security Headers & Anti-Hacking Protection Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS (Supports custom domains or wildcard for production)
cors_origins_raw = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", "*"))
origins = ["*"] if cors_origins_raw == "*" else [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

# Production safety: disallow wildcard origins
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production" and origins == ["*"]:
    raise RuntimeError("CORS wildcard not allowed in production; set explicit ALLOWED_ORIGINS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(machines_router)
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(alerts_router)
app.include_router(ai_router)
app.include_router(reports_router)
app.include_router(attendance_router)
app.include_router(smart_factory_router)
app.include_router(enterprise_router)

# WebSocket Endpoint for Industry 4.0 Live Fleet Telemetry Stream
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    db = SessionLocal()
    try:
        machines = db.query(Machine).all()
        fleet_telemetry = [{
            "id": m.id,
            "name": m.name,
            "model_code": m.model_code,
            "machine_type": m.machine_type,
            "status": m.status,
            "health_score": m.health_score,
            "temperature": m.temperature,
            "vibration": m.vibration,
            "motor_load": m.motor_load,
            "rpm": m.rpm,
            "power_consumption": m.power_consumption,
            "spindle_load": m.spindle_load
        } for m in machines]
        await websocket.send_json({"type": "TELEMETRY_PULSE", "machines": fleet_telemetry})
    except Exception:
        pass
    finally:
        db.close()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Background Industry 4.0 IoT Telemetry Simulator & Broadcaster
async def telemetry_broadcaster():
    while True:
        await asyncio.sleep(3)
        if ws_manager.active_connections:
            db = SessionLocal()
            try:
                machines = db.query(Machine).all()
                fleet_telemetry = []
                for m in machines:
                    if m.status in [MachineStatus.RUNNING.value, MachineStatus.WARNING.value]:
                        m.temperature = round(max(30.0, m.temperature + random.uniform(-0.4, 0.5)), 1)
                        m.vibration = round(max(0.4, m.vibration + random.uniform(-0.06, 0.08)), 1)
                        m.motor_load = round(max(20.0, min(98.0, m.motor_load + random.uniform(-1.5, 1.5))), 1)
                        m.spindle_load = round(max(10.0, min(95.0, m.spindle_load + random.uniform(-1.2, 1.2))), 1)
                        m.rpm = round(max(100.0, m.rpm + random.uniform(-40, 40)), 0)

                        # Recalculate Health Score
                        health_calc = calculate_machine_health(m.temperature, m.vibration, m.motor_load, m.spindle_load, m.operating_hours)
                        m.health_score = health_calc["health_score"]

                    fleet_telemetry.append({
                        "id": m.id,
                        "name": m.name,
                        "model_code": m.model_code,
                        "status": m.status,
                        "health_score": m.health_score,
                        "temperature": m.temperature,
                        "vibration": m.vibration,
                        "motor_load": m.motor_load,
                        "rpm": m.rpm,
                        "power_consumption": m.power_consumption,
                        "spindle_load": m.spindle_load
                    })
                db.commit()
                await ws_manager.broadcast({"type": "TELEMETRY_PULSE", "machines": fleet_telemetry})
            except Exception as e:
                db.rollback()
            finally:
                db.close()

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    
    start_mqtt_client()
    asyncio.create_task(telemetry_broadcaster())

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "NEXUSPROD AI - Industry 4.0 Smart Factory Platform v3.5.0",
        "security": "AES-256 GCM + Rate Limiting Active",
        "websocket": "ws://127.0.0.1:8000/ws/telemetry",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


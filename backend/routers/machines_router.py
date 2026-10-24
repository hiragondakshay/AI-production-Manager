import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Machine, MachineStatus, Alert, AlertSeverity
from schemas import MachineResponse, MachineCreate, MachineUpdate
from services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/machines", tags=["Machines"])

@router.get("", response_model=List[MachineResponse])
def list_machines(db: Session = Depends(get_db)):
    return db.query(Machine).all()

@router.post("", response_model=MachineResponse)
def create_machine(machine_in: MachineCreate, db: Session = Depends(get_db)):
    m = Machine(**machine_in.dict())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.get("/{machine_id}", response_model=MachineResponse)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    return m

@router.put("/{machine_id}", response_model=MachineResponse)
def update_machine(machine_id: int, update_in: MachineUpdate, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(m, field, val)

    # Auto-generate alert if status set to breakdown
    if update_in.status == MachineStatus.BREAKDOWN.value:
        alert = Alert(
            alert_type="maintenance_warning",
            severity=AlertSeverity.CRITICAL.value,
            message=f"{m.name} ({m.model_code}) transitioned to BREAKDOWN state.",
            source_id=m.model_code
        )
        db.add(alert)

    db.commit()
    db.refresh(m)

    # Broadcast updated machine state via WebSockets
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
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ws_manager.broadcast(ws_data))
    except Exception:
        pass

    return m

@router.post("/{machine_id}/telemetry", response_model=MachineResponse)
def update_telemetry(machine_id: int, temp: float, vibration: float, add_hours: float = 1.0, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")

    m.temperature = temp
    m.vibration = vibration
    m.operating_hours += add_hours

    # Health recalculation logic
    health = 100.0 - max(0.0, (temp - 45.0) * 1.2) - max(0.0, (vibration - 1.2) * 15.0)
    m.health_score = round(max(5.0, min(100.0, health)), 1)

    if temp > 75.0 or vibration > 4.5:
        m.status = MachineStatus.BREAKDOWN.value
        db.add(Alert(
            alert_type="maintenance_warning",
            severity=AlertSeverity.CRITICAL.value,
            message=f"CRITICAL SENSOR SPIKE on {m.name}: Temp={temp}°C, Vib={vibration}mm/s",
            source_id=m.model_code
        ))

    db.commit()
    db.refresh(m)

    # Broadcast instant telemetry pulse to WebSockets
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
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ws_manager.broadcast(ws_data))
    except Exception:
        pass

    return m

@router.post("/{machine_id}/reset-health", response_model=MachineResponse)
def reset_machine_health(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")

    m.status = MachineStatus.RUNNING.value
    m.temperature = 45.0
    m.vibration = 1.1
    m.health_score = 98.0
    db.commit()
    db.refresh(m)

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
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ws_manager.broadcast(ws_data))
    except Exception:
        pass

    return m

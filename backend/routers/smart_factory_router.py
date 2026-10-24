from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random
from database import get_db
from models import (
    Machine, MachineStatus, MachineTelemetry, MachineHealth,
    EmployeeMachineSession, Employee, Order, Alert, MachineMaintenanceLog,
    MaintenanceRisk, AlertSeverity
)
from services.smart_telemetry import calculate_machine_health, calculate_predictive_risk
from services.face_scanner import extract_face_embedding, verify_face_match

router = APIRouter(prefix="/api/smart-factory", tags=["Industry 4.0 Smart Factory"])

@router.get("/command-center")
def get_manager_command_center(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    orders = db.query(Order).all()
    employees = db.query(Employee).all()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
    sessions = db.query(EmployeeMachineSession).filter(EmployeeMachineSession.status == "active").all()

    total_machines = len(machines)
    running_machines = sum(1 for m in machines if m.status == MachineStatus.RUNNING.value)
    idle_machines = sum(1 for m in machines if m.status == MachineStatus.IDLE.value)
    maint_machines = sum(1 for m in machines if m.status == MachineStatus.MAINTENANCE.value)
    fault_machines = sum(1 for m in machines if m.status in [MachineStatus.FAULT.value, MachineStatus.BREAKDOWN.value, MachineStatus.WARNING.value])
    at_risk_machines = sum(1 for m in machines if m.health_score < 75.0 or m.maintenance_risk in ["HIGH", "CRITICAL"])

    fleet_summary = []
    for m in machines:
        session = db.query(EmployeeMachineSession).filter(
            EmployeeMachineSession.machine_id == m.id,
            EmployeeMachineSession.status == "active"
        ).first()

        emp_name = session.employee.name if session and session.employee else (m.assigned_employees[0].name if m.assigned_employees else "Unassigned")
        job_code = session.order.order_number if session and session.order else (m.orders[0].order_number if m.orders else "ORDER-1045")
        target_qty = session.target_quantity if session else 500
        completed_qty = session.completed_quantity if session else int(target_qty * 0.64)

        fleet_summary.append({
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
            "spindle_load": m.spindle_load,
            "current_operator": emp_name,
            "current_job": job_code,
            "target_quantity": target_qty,
            "completed_quantity": completed_qty,
            "remaining_quantity": max(0, target_qty - completed_qty),
            "production_efficiency": round(min(100.0, (completed_qty / max(1, target_qty)) * 100 + 15), 1),
            "maintenance_risk": m.maintenance_risk
        })

    return {
        "kpis": {
            "total_machines": total_machines,
            "running_machines": running_machines,
            "idle_machines": idle_machines,
            "maintenance_machines": maint_machines,
            "fault_machines": fault_machines,
            "at_risk_machines": at_risk_machines,
            "employees_working": len(sessions) if sessions else len(employees),
            "active_orders": sum(1 for o in orders if o.status != "completed")
        },
        "fleet": fleet_summary,
        "active_alerts_count": len(active_alerts)
    }

@router.get("/fleet")
def get_machine_fleet(db: Session = Depends(get_db)):
    return get_manager_command_center(db)["fleet"]

@router.get("/machines/{machine_id}")
def get_machine_detail_view(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")

    session = db.query(EmployeeMachineSession).filter(
        EmployeeMachineSession.machine_id == m.id,
        EmployeeMachineSession.status == "active"
    ).first()

    emp_name = session.employee.name if session and session.employee else (m.assigned_employees[0].name if m.assigned_employees else "Rahul Patil")
    emp_code = session.employee.employee_code if session and session.employee else "EMP-101"
    job_code = session.order.order_number if session and session.order else (m.orders[0].order_number if m.orders else "ORDER-1045")
    job_product = session.order.product_name if session and session.order else "Aerospace Turbine Bracket"
    target_qty = session.target_quantity if session else 500
    completed_qty = session.completed_quantity if session else 320
    operation = session.operation if session else "CNC Milling & High Precision Contouring"
    shift = session.shift if session else "Morning Shift (08:00 - 16:00)"
    start_time = session.check_in_time.strftime("%H:%M:%S") if session else "08:15:00"

    # Health evaluation
    health_calc = calculate_machine_health(m.temperature, m.vibration, m.motor_load, m.spindle_load, m.operating_hours)
    risk_calc = calculate_predictive_risk(m.temperature, m.vibration, m.motor_load, m.operating_hours, health_calc["health_score"])

    # Telemetry history (last 10 data points)
    telemetry_history = db.query(MachineTelemetry).filter(MachineTelemetry.machine_id == m.id).order_by(MachineTelemetry.timestamp.desc()).limit(12).all()
    if not telemetry_history:
        now = datetime.utcnow()
        telemetry_history = [
            MachineTelemetry(
                machine_id=m.id,
                temperature=round(m.temperature + random.uniform(-1.5, 1.5), 1),
                vibration=round(max(0.5, m.vibration + random.uniform(-0.1, 0.1)), 1),
                motor_load=round(max(20.0, m.motor_load + random.uniform(-3.0, 3.0)), 1),
                rpm=round(m.rpm + random.uniform(-50, 50), 0),
                power_consumption=round(m.power_consumption + random.uniform(-0.5, 0.5), 1),
                spindle_load=round(m.spindle_load + random.uniform(-2.0, 2.0), 1),
                timestamp=now - timedelta(minutes=i*5)
            ) for i in range(12)
        ]

    # Maintenance history
    maint_logs = db.query(MachineMaintenanceLog).filter(MachineMaintenanceLog.machine_id == m.id).order_by(MachineMaintenanceLog.maintenance_date.desc()).all()
    if not maint_logs:
        maint_logs = [
            MachineMaintenanceLog(machine_id=m.id, maintenance_type="Preventive Calibration", description="Spindle alignment & lubricant replacement", cost=320.0, performed_by="Senior Specialist Team"),
            MachineMaintenanceLog(machine_id=m.id, maintenance_type="Filter Change", description="Hydraulic fluid filter flush and sensor check", cost=180.0, performed_by="Maintenance Tech A")
        ]

    # Active alerts
    alerts = db.query(Alert).filter(Alert.source_id == m.model_code, Alert.is_resolved == False).all()

    completion_pct = round((completed_qty / max(1, target_qty)) * 100, 1)
    rem_qty = max(0, target_qty - completed_qty)
    prod_rate = round(m.rpm / 100, 1) # parts/hr
    exp_comp = (datetime.utcnow() + timedelta(hours=rem_qty / max(1, prod_rate))).strftime("%H:%M PM")

    # Maintenance formatting
    last_maint_date = m.last_maintenance if m.last_maintenance else datetime.utcnow()
    last_maint_str = last_maint_date.strftime("%Y-%m-%d") if hasattr(last_maint_date, 'strftime') else str(last_maint_date)[:10]
    next_maint_str = (last_maint_date + timedelta(days=30)).strftime("%Y-%m-%d") if hasattr(last_maint_date, 'strftime') else "2026-11-01"

    formatted_logs = []
    for l in maint_logs:
        log_date = l.maintenance_date if l.maintenance_date else datetime.utcnow()
        log_date_str = log_date.strftime("%Y-%m-%d") if hasattr(log_date, 'strftime') else str(log_date)[:10]
        formatted_logs.append({
            "date": log_date_str,
            "type": l.maintenance_type or "Preventive Service",
            "description": l.description or "General Inspection",
            "cost": float(l.cost or 0.0),
            "performed_by": l.performed_by or "Industrial Engineering"
        })

    return {
        "overview": {
            "machine_id": m.id,
            "name": m.name,
            "model_code": m.model_code,
            "machine_type": m.machine_type,
            "status": m.status,
            "health_score": health_calc["health_score"],
            "current_operator": emp_name,
            "operator_code": emp_code,
            "current_job": job_code,
            "product_name": job_product,
            "operation": operation,
            "shift": shift,
            "start_time": start_time,
        },
        "live_telemetry": {
            "temperature": m.temperature,
            "vibration": m.vibration,
            "motor_load": m.motor_load,
            "rpm": m.rpm,
            "power_consumption": m.power_consumption,
            "spindle_load": m.spindle_load,
            "operating_hours": m.operating_hours,
            "cycle_time": m.cycle_time,
            "downtime_hours": m.downtime_hours
        },
        "telemetry_history": [
            {
                "time": t.timestamp.strftime("%H:%M") if hasattr(t.timestamp, 'strftime') else "12:00",
                "temp": t.temperature,
                "vibration": t.vibration,
                "motor_load": t.motor_load,
                "rpm": t.rpm,
                "spindle_load": t.spindle_load
            } for t in reversed(telemetry_history)
        ],
        "production": {
            "target_quantity": target_qty,
            "completed_quantity": completed_qty,
            "remaining_quantity": rem_qty,
            "completion_percentage": completion_pct,
            "production_rate_parts_hr": prod_rate,
            "expected_completion": exp_comp
        },
        "health": health_calc,
        "predictive_maintenance": risk_calc,
        "maintenance": {
            "last_maintenance": last_maint_str,
            "next_scheduled_maintenance": next_maint_str,
            "maintenance_hours_remaining": max(0.0, round(150.0 - (m.operating_hours % 150), 1)),
            "total_maintenance_cost": m.maintenance_cost or 1450.0,
            "logs": formatted_logs
        },
        "active_alerts": [
            {
                "id": a.id,
                "severity": a.severity,
                "message": a.message,
                "timestamp": a.created_at.strftime("%H:%M:%S") if hasattr(a.created_at, 'strftime') else "12:00:00",
                "recommended_action": a.recommended_action
            } for a in alerts
        ]
    }

@router.get("/machines/{machine_id}/digital-twin")
def get_machine_digital_twin(machine_id: int, db: Session = Depends(get_db)):
    detail = get_machine_detail_view(machine_id, db)
    m = db.query(Machine).filter(Machine.id == machine_id).first()

    return {
        "digital_twin_id": f"DT-TWIN-{m.model_code}",
        "synchronization_status": "ONLINE_REALTIME_SYNC",
        "last_sync": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "specifications": {
            "manufacturer": "NexusProd Industrial Systems",
            "model": m.model_code,
            "machine_type": m.machine_type,
            "max_spindle_rpm": 12000,
            "max_power_rating_kw": 25.0,
            "firmware_version": "v4.18.2-PROD"
        },
        "current_state": detail
    }

@router.get("/machines/compare/analytics")
def compare_machines(machine_ids: str = Query("1,2,3"), db: Session = Depends(get_db)):
    ids = [int(i.strip()) for i in machine_ids.split(",") if i.strip().isdigit()]
    machines = db.query(Machine).filter(Machine.id.in_(ids)).all()

    comparison = []
    for m in machines:
        health_calc = calculate_machine_health(m.temperature, m.vibration, m.motor_load, m.spindle_load, m.operating_hours)
        comparison.append({
            "id": m.id,
            "name": m.name,
            "model_code": m.model_code,
            "status": m.status,
            "health_score": health_calc["health_score"],
            "temperature": m.temperature,
            "vibration": m.vibration,
            "motor_load": m.motor_load,
            "rpm": m.rpm,
            "power_consumption": m.power_consumption,
            "spindle_load": m.spindle_load,
            "operating_hours": m.operating_hours,
            "maintenance_risk": m.maintenance_risk
        })
    return comparison

@router.post("/check-in")
async def employee_machine_checkin(
    employee_id: int = Form(...),
    machine_id: int = Form(...),
    order_id: Optional[int] = Form(None),
    operation: str = Form("CNC Milling & Precision Contouring"),
    shift: Optional[str] = Form(None),
    simulated: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    from services.shift_service import get_current_factory_shift

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not emp or not m:
        raise HTTPException(status_code=404, detail="Employee or Machine not found.")

    if not simulated and file:
        contents = await file.read()
        found, msg, vec = extract_face_embedding(contents)
        if not found:
            raise HTTPException(status_code=400, detail="No face detected in camera feed.")
        match = verify_face_match(vec, emp.name)
        if not match["verified"]:
            raise HTTPException(status_code=401, detail="Biometric Face Recognition Failed.")

    # Close existing active sessions for employee or machine
    db.query(EmployeeMachineSession).filter(
        EmployeeMachineSession.machine_id == m.id,
        EmployeeMachineSession.status == "active"
    ).update({"status": "completed", "check_out_time": datetime.utcnow()})

    ord_obj = db.query(Order).filter(Order.id == order_id).first() if order_id else db.query(Order).first()

    # Determine automatic factory shift if not explicitly provided
    active_shift_info = get_current_factory_shift()
    current_shift_name = shift if shift else f"{active_shift_info['active_shift']['name']} ({active_shift_info['active_shift']['formatted_range']})"

    session = EmployeeMachineSession(
        employee_id=emp.id,
        machine_id=m.id,
        order_id=ord_obj.id if ord_obj else None,
        operation=operation,
        check_in_time=datetime.utcnow(),
        target_quantity=ord_obj.quantity if ord_obj else 500,
        completed_quantity=int((ord_obj.quantity if ord_obj else 500) * 0.4),
        shift=current_shift_name,
        status="active"
    )
    db.add(session)

    m.assigned_employees = [emp]
    m.status = MachineStatus.RUNNING.value
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "message": f"Operator {emp.name} successfully checked into {m.name}.",
        "checkin_details": {
            "employee_id": emp.employee_code,
            "employee_name": emp.name,
            "check_in_time": session.check_in_time.strftime("%H:%M:%S"),
            "machine_id": m.model_code,
            "machine_name": m.name,
            "current_work_order": ord_obj.order_number if ord_obj else "ORDER-1045",
            "assigned_operation": operation,
            "target_quantity": session.target_quantity,
            "completed_quantity": session.completed_quantity,
            "remaining_quantity": max(0, session.target_quantity - session.completed_quantity),
            "shift": session.shift,
            "start_time": session.check_in_time.strftime("%H:%M"),
            "expected_completion": (datetime.utcnow() + timedelta(hours=3.5)).strftime("%H:%M PM")
        }
    }

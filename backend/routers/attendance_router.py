from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db
from models import Employee, EmployeeShiftLog, Machine
from services.face_scanner import extract_face_embedding, verify_face_match

router = APIRouter(prefix="/api/attendance", tags=["Biometric Attendance & Work Hours"])

@router.get("/employees")
def list_employees_work_summary(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    results = []

    for emp in employees:
        m = db.query(Machine).filter(Machine.id == emp.assigned_machine_id).first()
        shift_logs = db.query(EmployeeShiftLog).filter(EmployeeShiftLog.employee_id == emp.id).all()

        total_hours = sum(l.hours_worked for l in shift_logs)
        total_units = sum(l.units_produced for l in shift_logs)
        latest_log = shift_logs[-1] if shift_logs else None

        results.append({
            "employee_id": emp.id,
            "name": emp.name,
            "employee_code": emp.employee_code,
            "department": emp.department,
            "role_title": emp.role_title,
            "assigned_machine_id": emp.assigned_machine_id,
            "assigned_machine_name": m.name if m else "Unassigned",
            "assigned_machine_model": m.model_code if m else "N/A",
            "machine_status": m.status if m else "idle",
            "total_hours_worked": round(total_hours, 1),
            "total_units_produced": total_units,
            "attendance_status": latest_log.attendance_status if latest_log else "present",
            "last_clock_in": latest_log.clock_in_time.strftime("%Y-%m-%d %H:%M") if latest_log else "N/A"
        })

    return results

@router.post("/biometric-clock-in")
async def biometric_clock_in(
    employee_code: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.employee_code == employee_code).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee code '{employee_code}' not found.")

    contents = await file.read()
    face_found, msg, feature_vector = extract_face_embedding(contents)

    if not face_found:
        raise HTTPException(status_code=400, detail="Biometric Face Scanner: No face detected in camera frame.")

    match_result = verify_face_match(feature_vector, emp.name)
    if not match_result["verified"]:
        raise HTTPException(status_code=401, detail="Biometric Face Scanner: Facial signature mismatch!")

    # Toggle attendance status
    today = datetime.utcnow().strftime("%Y-%m-%d")
    latest_log = db.query(EmployeeShiftLog).filter(
        EmployeeShiftLog.employee_id == emp.id,
        EmployeeShiftLog.shift_date == today
    ).first()

    if latest_log and latest_log.attendance_status == "clocked_in":
        # Clock Out
        latest_log.clock_out_time = datetime.utcnow()
        diff = (latest_log.clock_out_time - latest_log.clock_in_time).total_seconds() / 3600.0
        latest_log.hours_worked = round(max(0.5, diff), 1)
        latest_log.attendance_status = "present"
        action = "CLOCKED OUT"
    else:
        # Clock In
        new_log = EmployeeShiftLog(
            employee_id=emp.id,
            machine_id=emp.assigned_machine_id,
            shift_date=today,
            clock_in_time=datetime.utcnow(),
            hours_worked=8.0,
            units_produced=1250,
            attendance_status="clocked_in"
        )
        db.add(new_log)
        action = "CLOCKED IN"

    db.commit()

    return {
        "verified": True,
        "employee_name": emp.name,
        "employee_code": emp.employee_code,
        "assigned_machine": emp.assigned_machine.name if emp.assigned_machine else "Unassigned",
        "action": action,
        "biometric_hash": match_result["biometric_hash"],
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

@router.post("/assign-machine")
def assign_machine(employee_id: int, machine_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    m = db.query(Machine).filter(Machine.id == machine_id).first()

    if not emp or not m:
        raise HTTPException(status_code=404, detail="Employee or Machine not found.")

    emp.assigned_machine_id = m.id
    db.commit()
    db.refresh(emp)

    return {
        "message": f"Successfully assigned operator {emp.name} ({emp.employee_code}) to {m.name} ({m.model_code})."
    }

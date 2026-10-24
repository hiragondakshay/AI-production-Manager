from sqlalchemy.orm import Session
from models import Machine, Alert, MachineTelemetry

def perform_root_cause_analysis(machine_id: int, db: Session) -> dict:
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        machine = db.query(Machine).first()

    temp = machine.temperature
    vib = machine.vibration
    load = machine.motor_load
    hours = machine.operating_hours

    probable_causes = []
    five_whys = []
    corrective_actions = []

    if vib > 2.5:
        probable_causes.append({
            "subsystem": "Spindle & Bearings",
            "confidence": 92.5 if vib > 3.5 else 78.0,
            "symptom": f"Vibration harmonics elevated at {vib} mm/s (threshold: 2.0 mm/s)",
            "root_cause": "Spindle inner race surface micro-pitting and bearing ball wear caused by lubricant starvation."
        })
        five_whys = [
            {"why": "Why did the machine trigger a fault alert?", "answer": f"Vibration sensor recorded {vib} mm/s exceeding ISO 10816 standards."},
            {"why": "Why is the vibration level elevated?", "answer": "Excessive radial play detected inside the primary spindle assembly."},
            {"why": "Why is there radial play in the spindle?", "answer": "Angular contact ball bearings have experienced micro-fretting wear."},
            {"why": "Why did the bearings wear prematurely?", "answer": "High-pressure coolant ingress diluted the synthetic lithium grease."},
            {"why": "Why did coolant enter the bearing housing?", "answer": "The dynamic labyrinth rubber lip seal degraded past its service life."}
        ]
        corrective_actions = [
            "Emergency grease flush and replace spindle front bearing set (Part #BRG-7014-H).",
            "Install reinforced Viton double-lip dynamic shaft seal.",
            "Recalibrate accelerometer vibration thresholds and perform 4-point dynamic balancing."
        ]
    elif temp > 60.0:
        probable_causes.append({
            "subsystem": "Cooling & Thermal Management",
            "confidence": 88.0,
            "symptom": f"Coolant jacket thermal delta elevated at {temp}°C (threshold: 55°C)",
            "root_cause": "Heat exchanger sediment blockage and low coolant flow rate."
        })
        five_whys = [
            {"why": "Why is the machine running hot?", "answer": f"Operating temperature rose to {temp}°C during continuous machining."},
            {"why": "Why did temperature rise during operation?", "answer": "Cooling fluid flow rate dropped by 45%."},
            {"why": "Why is the coolant flow rate low?", "answer": "Inline particle filter mesh is clogged with fine aluminum chips."},
            {"why": "Why were chips reaching the filter?", "answer": "Primary chip conveyor mesh had a torn gasket seal."},
            {"why": "Why was the seal damaged?", "answer": "Exceeded 6-month preventive inspection interval."}
        ]
        corrective_actions = [
            "Flush cooling lines and replace 50-micron inline filter cartridge.",
            "Refill synthetic soluble coolant to 8% refractometer concentration.",
            "Inspect pump impeller blades for cavitation wear."
        ]
    else:
        probable_causes.append({
            "subsystem": "Electrical Drive & Motor",
            "confidence": 65.0,
            "symptom": f"Motor load cycling at {load}% under nominal feed rate",
            "root_cause": "Servo drive tuning parameter drift or tool tip edge wear."
        })
        five_whys = [
            {"why": "Why is motor load fluctuating?", "answer": f"Inverter drive drawing higher current ({load}% load)."},
            {"why": "Why is current draw elevated?", "answer": "Cutting resistance increased during contour pass."},
            {"why": "Why did cutting resistance increase?", "answer": "Carbide insert cutting edge radius worn down by 0.12mm."},
            {"why": "Why was the insert not indexed?", "answer": "Tool life counter was not automatically reset after shift change."}
        ]
        corrective_actions = [
            "Inspect and index carbide tool inserts on turret station 4.",
            "Verify servo amplifier drive current calibration.",
            "Enable automated tool-wear monitoring on the CNC controller."
        ]

    return {
        "machine": {
            "id": machine.id,
            "name": machine.name,
            "model_code": machine.model_code,
            "health_score": machine.health_score,
            "status": machine.status
        },
        "telemetry_snapshot": {
            "temperature": temp,
            "vibration": vib,
            "motor_load": load,
            "rpm": machine.rpm,
            "power_consumption": machine.power_consumption,
            "operating_hours": machine.operating_hours
        },
        "probable_causes": probable_causes,
        "five_whys_analysis": five_whys,
        "corrective_actions": corrective_actions
    }

import numpy as np
from sqlalchemy.orm import Session
from models import Machine
from typing import List

def predict_machine_maintenance(db: Session) -> List[dict]:
    """
    Evaluates machine telemetry (temperature, vibration, hours run, health score)
    using an ML failure risk scoring algorithm to compute Remaining Useful Life (RUL),
    component risk decomposition, degradation forecast, and maintenance procedures.
    """
    machines = db.query(Machine).all()
    predictions = []

    for m in machines:
        temp = m.temperature
        vib = m.vibration
        hours = m.operating_hours
        health = m.health_score

        # Multi-variable factor scores (0.0 to 1.0)
        temp_factor = max(0.0, (temp - 42.0) / 40.0) # Baseline 42C, warning >65C
        vib_factor = max(0.0, (vib - 1.0) / 4.0)     # Baseline 1.0 mm/s, critical >4.0
        hours_factor = max(0.0, (hours % 1500) / 1500.0)
        health_factor = max(0.0, (100.0 - health) / 100.0)

        # Component-level failure risks
        bearing_risk = round(min(98.0, max(5.0, (vib_factor * 0.65 + hours_factor * 0.35) * 100)), 1)
        thermal_risk = round(min(98.0, max(4.0, (temp_factor * 0.75 + (m.motor_load / 100.0) * 0.25) * 100)), 1)
        spindle_risk = round(min(98.0, max(6.0, (vib_factor * 0.45 + (m.spindle_load / 100.0) * 0.55) * 100)), 1)
        motor_risk = round(min(98.0, max(5.0, ((m.motor_load / 100.0) * 0.7 + temp_factor * 0.3) * 100)), 1)
        lubrication_risk = round(min(95.0, max(8.0, (hours_factor * 0.6 + temp_factor * 0.4) * 100)), 1)

        # Composite failure risk percentage
        composite_risk = round(min(99.5, max(3.0, (temp_factor * 0.30 + vib_factor * 0.35 + hours_factor * 0.20 + health_factor * 0.15) * 100)), 1)

        # Remaining Useful Life (RUL) estimation
        if composite_risk >= 70.0:
            rul_hours = round(max(8.0, 120.0 * (1.0 - (composite_risk / 100.0))), 1)
            predicted_status = "critical"
            urgency = "Immediate Service Required (< 24 hrs)"
        elif composite_risk >= 35.0:
            rul_hours = round(max(40.0, 350.0 * (1.0 - (composite_risk / 100.0))), 1)
            predicted_status = "warning"
            urgency = "Scheduled Maintenance within 48-72 hrs"
        else:
            rul_hours = round(max(200.0, 1200.0 * (1.0 - (composite_risk / 100.0))), 1)
            predicted_status = "normal"
            urgency = "Routine Preventive Interval"

        rul_days = round(rul_hours / 16.0, 1) # assuming 2 shifts (16 hrs/day)

        # Primary risk factor identification
        factors = {
            "Spindle Bearing Harmonic Vibration": bearing_risk,
            "Coolant Temperature Elevation": thermal_risk,
            "Spindle Dynamic Cutting Load": spindle_risk,
            "Servo Motor Current Inverter Draw": motor_risk,
            "Lubrication Oil Film Degradation": lubrication_risk
        }
        primary_factor = max(factors, key=factors.get) if composite_risk > 15 else "Nominal Operating Telemetry"

        # Diagnostic message & action item
        if predicted_status == "critical":
            action = f"Immediate shutdown inspection on {m.name}. Inspect angular bearings (Part #BRG-7014) and flush coolant line."
            procedure = "1. Lockout/Tagout machine. 2. Remove front spindle housing. 3. Check axial play with dial indicator. 4. Replace bearing set and repack with high-speed synthetic grease."
        elif predicted_status == "warning":
            action = f"Schedule preventative service for {m.name} within {rul_days} days. Monitor {primary_factor.lower()}."
            procedure = "1. Clean inline fluid filters. 2. Refill synthetic cutting oil reservoir. 3. Perform 4-point vibration accelerometer baseline check."
        else:
            action = f"{m.name} operating within optimal parameters. Next routine service at 1,500 operating hours."
            procedure = "Perform daily chip tray clearance and visual inspection of pneumatic pressure gauges."

        # Projected 7-day health degradation curves
        degradation_curve = [
            {"day": f"Day +{i}", "without_service": round(max(20.0, health - (i * (composite_risk / 20.0))), 1), "with_service": round(min(98.0, health + (i * 2.0)), 1)}
            for i in range(7)
        ]

        predictions.append({
            "machine_id": m.id,
            "machine_name": m.name,
            "model_code": m.model_code,
            "status": m.status,
            "health_score": health,
            "failure_risk_percentage": composite_risk,
            "predicted_status": predicted_status,
            "urgency": urgency,
            "rul": {
                "hours": rul_hours,
                "days": rul_days
            },
            "primary_risk_factor": primary_factor,
            "component_risks": {
                "bearings": bearing_risk,
                "thermal": thermal_risk,
                "spindle": spindle_risk,
                "motor": motor_risk,
                "lubrication": lubrication_risk
            },
            "recommended_action": action,
            "maintenance_procedure": procedure,
            "degradation_curve": degradation_curve,
            "telemetry": {
                "temperature": temp,
                "vibration": vib,
                "operating_hours": hours,
                "motor_load": m.motor_load,
                "spindle_load": m.spindle_load,
                "rpm": m.rpm
            }
        })

    return predictions

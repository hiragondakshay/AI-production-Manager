def calculate_machine_health(temp: float, vibration: float, motor_load: float, spindle_load: float, operating_hours: float):
    temp_penalty = max(0.0, (temp - 45.0) * 1.5)
    vib_penalty = max(0.0, (vibration - 1.2) * 18.0)
    motor_penalty = max(0.0, (motor_load - 70.0) * 0.8)
    spindle_penalty = max(0.0, (spindle_load - 70.0) * 0.8)
    hours_penalty = max(0.0, (operating_hours - 3000.0) * 0.005)

    health_score = round(max(5.0, min(100.0, 100.0 - temp_penalty - vib_penalty - motor_penalty - spindle_penalty - hours_penalty)), 1)

    # Sub-component statuses
    temp_health = "Critical" if temp > 75.0 else "Warning" if temp > 60.0 else "Healthy"
    vib_health = "Critical" if vibration > 4.2 else "Warning" if vibration > 2.5 else "Healthy"
    motor_health = "Critical" if motor_load > 90.0 else "Warning" if motor_load > 80.0 else "Healthy"
    spindle_health = "Critical" if spindle_load > 90.0 else "Warning" if spindle_load > 80.0 else "Healthy"
    electrical_health = "Critical" if motor_load > 92.0 and temp > 70.0 else "Warning" if motor_load > 82.0 else "Healthy"

    if health_score >= 90.0:
        status_level = "Excellent"
    elif health_score >= 75.0:
        status_level = "Healthy"
    elif health_score >= 50.0:
        status_level = "Warning"
    else:
        status_level = "Critical"

    return {
        "health_score": health_score,
        "temp_health": temp_health,
        "vibration_health": vib_health,
        "motor_health": motor_health,
        "spindle_health": spindle_health,
        "electrical_health": electrical_health,
        "status_level": status_level
    }

def calculate_predictive_risk(temp: float, vibration: float, motor_load: float, operating_hours: float, health_score: float):
    risk = "LOW"
    reasons = []

    if vibration > 3.5:
        reasons.append(f"elevated vibration ({vibration} mm/s)")
    if temp > 68.0:
        reasons.append(f"high operating temperature ({temp}°C)")
    if motor_load > 85.0:
        reasons.append(f"heavy motor load ({motor_load}%)")
    if operating_hours > 3500.0:
        reasons.append(f"high cumulative operating hours ({operating_hours} hrs)")

    if health_score < 45.0 or (temp > 75.0 and vibration > 4.0):
        risk = "CRITICAL"
    elif health_score < 65.0 or len(reasons) >= 2:
        risk = "HIGH"
    elif health_score < 80.0 or len(reasons) >= 1:
        risk = "MEDIUM"

    if reasons:
        msg = f"Machine risk is categorized as {risk} based on " + ", ".join(reasons) + "."
    else:
        msg = "Machine parameters are within normal nominal ranges."

    return {
        "risk_level": risk,
        "diagnostic_message": msg,
        "reasons": reasons
    }

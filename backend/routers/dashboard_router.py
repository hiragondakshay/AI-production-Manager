from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Machine, Order, ProductionLog, Alert, MachineStatus, OrderStatus, AlertSeverity
from schemas import KPISummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=KPISummary)
def get_kpis(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    total_machines = len(machines)
    active_machines = len([m for m in machines if m.status == MachineStatus.RUNNING.value])

    # Downtime & Output calculation from production logs
    logs = db.query(ProductionLog).all()
    total_output = sum(l.units_produced for l in logs) if logs else 0
    total_defects = sum(l.defective_units for l in logs) if logs else 0
    total_downtime = sum(l.downtime_minutes for l in logs) if logs else 0.0

    # Availability Rate = (Planned Time - Downtime) / Planned Time
    # Assume total operational planned time across logs is 8 hrs per log
    planned_minutes = max(1.0, len(logs) * 480.0)
    operating_minutes = max(0.0, planned_minutes - total_downtime)
    availability = min(100.0, (operating_minutes / planned_minutes) * 100)

    # Quality Rate = (Good Units / Total Units Produced) * 100
    good_units = max(0, total_output - total_defects)
    quality_rate = min(100.0, (good_units / max(1, total_output)) * 100) if total_output > 0 else 98.0

    # Performance Rate = (Actual Output Rate / Standard Ideal Output Rate)
    # Baseline ideal rate is 200 units per shift log
    ideal_expected_output = len(logs) * 200
    performance_rate = min(100.0, (total_output / max(1, ideal_expected_output)) * 100) if total_output > 0 else 92.0

    # Overall OEE = (Availability * Performance * Quality) / 10000
    overall_oee = round((availability * performance_rate * quality_rate) / 10000.0, 1)

    # Uptime % across active fleet
    uptime_pct = round((active_machines / max(1, total_machines)) * 100, 1)

    pending_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.PENDING.value, OrderStatus.SCHEDULED.value])
    ).count()

    critical_alerts = db.query(Alert).filter(
        Alert.is_resolved == False,
        Alert.severity.in_([AlertSeverity.CRITICAL.value, AlertSeverity.WARNING.value])
    ).count()

    return {
        "total_output": total_output,
        "overall_oee": overall_oee,
        "availability_rate": round(availability, 1),
        "performance_rate": round(performance_rate, 1),
        "quality_rate": round(quality_rate, 1),
        "uptime_percentage": uptime_pct,
        "active_machines_count": active_machines,
        "total_machines_count": total_machines,
        "pending_orders_count": pending_orders,
        "critical_alerts_count": critical_alerts
    }

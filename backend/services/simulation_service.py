from sqlalchemy.orm import Session
from models import Machine, Order, MachineStatus
import random

def run_what_if_simulation(
    scenario_type: str,
    target_machine_id: int,
    downtime_hours: float,
    demand_increase_pct: float,
    db: Session
) -> dict:
    target_machine = db.query(Machine).filter(Machine.id == target_machine_id).first()
    if not target_machine:
        target_machine = db.query(Machine).first()

    all_machines = db.query(Machine).all()
    orders = db.query(Order).all()

    parts_per_hour = target_machine.rpm / 100.0 if target_machine.rpm > 0 else 45.0
    production_loss_units = int(parts_per_hour * downtime_hours)
    hourly_labor_machine_rate = 85.0 # USD/hr
    financial_loss = round((downtime_hours * hourly_labor_machine_rate) + (production_loss_units * 24.5), 2)

    # Find backup candidate machines
    candidate_machines = [
        m for m in all_machines 
        if m.id != target_machine.id and m.status in ["idle", "running"] and m.health_score >= 75.0
    ]
    backup_machine = candidate_machines[0] if candidate_machines else (all_machines[1] if len(all_machines) > 1 else target_machine)

    reroute_feasibility = "HIGH" if backup_machine.status == "idle" else "MEDIUM"
    schedule_delay_hours = round(downtime_hours * 0.4 if backup_machine.status == "idle" else downtime_hours * 1.1, 1)

    # Demand Increase Simulation
    simulated_demand_units = sum(o.quantity for o in orders) * (1.0 + (demand_increase_pct / 100.0))
    additional_capacity_needed_hrs = round((simulated_demand_units - sum(o.quantity for o in orders)) / 45.0, 1)

    recommendations = [
        f"Reroute affected work order to {backup_machine.name} ({backup_machine.model_code}) which has {backup_machine.health_score}% health rating.",
        f"Schedule overtime shift (+{schedule_delay_hours} hrs) to compensate for {production_loss_units} lost units.",
        f"Expedite raw material replenishment to support a {demand_increase_pct}% surge in order volume."
    ]

    return {
        "scenario_type": scenario_type,
        "target_machine": {
            "id": target_machine.id,
            "name": target_machine.name,
            "model_code": target_machine.model_code,
            "health_score": target_machine.health_score
        },
        "simulation_parameters": {
            "downtime_hours": downtime_hours,
            "demand_increase_pct": demand_increase_pct,
            "simulated_demand_total_units": int(simulated_demand_units)
        },
        "impact_analysis": {
            "production_loss_units": production_loss_units,
            "estimated_financial_loss_usd": financial_loss,
            "schedule_delay_hours": schedule_delay_hours,
            "criticality": "CRITICAL" if financial_loss > 3000 else "HIGH" if financial_loss > 1500 else "MODERATE"
        },
        "mitigation_plan": {
            "recommended_backup_machine": {
                "id": backup_machine.id,
                "name": backup_machine.name,
                "model_code": backup_machine.model_code,
                "status": backup_machine.status,
                "health_score": backup_machine.health_score
            },
            "reroute_feasibility": reroute_feasibility,
            "additional_capacity_hours_needed": additional_capacity_needed_hrs,
            "recommendations": recommendations
        }
    }

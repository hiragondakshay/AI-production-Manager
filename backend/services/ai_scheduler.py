from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Order, Machine, OrderPriority, OrderStatus, MachineStatus

def generate_ai_schedule(db: Session) -> dict:
    """
    AI-optimized production scheduler that automatically matches pending/unscheduled orders
    to optimal operational machines based on order priority, machine health, and deadline urgency.
    """
    # Fetch pending/scheduled orders
    pending_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.PENDING.value, OrderStatus.SCHEDULED.value])
    ).all()

    # Priority mapping weight
    priority_weights = {
        OrderPriority.URGENT.value: 100,
        OrderPriority.HIGH.value: 75,
        OrderPriority.MEDIUM.value: 50,
        OrderPriority.LOW.value: 25
    }

    # Sort orders by priority and deadline
    sorted_orders = sorted(
        pending_orders,
        key=lambda o: (-priority_weights.get(o.priority, 50), o.deadline)
    )

    # Fetch active/healthy machines
    available_machines = db.query(Machine).filter(
        Machine.status.in_([MachineStatus.RUNNING.value, MachineStatus.IDLE.value])
    ).all()

    if not available_machines:
        # Fallback to all machines except breakdown
        available_machines = db.query(Machine).filter(Machine.status != MachineStatus.BREAKDOWN.value).all()

    schedule_results = []
    current_time = datetime.now()

    machine_availability_pt = {m.id: current_time for m in available_machines}

    for order in sorted_orders:
        if not available_machines:
            break

        # Pick machine with highest health score and earliest availability
        best_machine = max(
            available_machines,
            key=lambda m: (m.health_score, - (machine_availability_pt[m.id] - current_time).total_seconds())
        )

        start_time = machine_availability_pt[best_machine.id]
        # Estimate production time: ~100 units per hour base rate adjusted by health score
        rate = max(20, 100 * (best_machine.health_score / 100.0))
        hours_needed = max(0.5, order.quantity / rate)
        completion_time = start_time + timedelta(hours=hours_needed)

        # Update machine availability pointer
        machine_availability_pt[best_machine.id] = completion_time

        # Calculate priority score
        p_score = priority_weights.get(order.priority, 50) + (best_machine.health_score * 0.2)

        reason = (
            f"Assigned to {best_machine.name} ({best_machine.model_code}) due to high health "
            f"({best_machine.health_score}%) and {order.priority.upper()} priority deadline."
        )

        schedule_results.append({
            "order_id": order.id,
            "order_number": order.order_number,
            "product_name": order.product_name,
            "quantity": order.quantity,
            "priority": order.priority,
            "deadline": order.deadline.strftime("%Y-%m-%d %H:%M"),
            "recommended_machine_id": best_machine.id,
            "recommended_machine_name": best_machine.name,
            "estimated_start": start_time.strftime("%Y-%m-%d %H:%M"),
            "estimated_completion": completion_time.strftime("%Y-%m-%d %H:%M"),
            "estimated_duration_hours": round(hours_needed, 1),
            "priority_score": round(p_score, 1),
            "reason": reason
        })

    return {
        "scheduled_count": len(schedule_results),
        "schedule": schedule_results
    }

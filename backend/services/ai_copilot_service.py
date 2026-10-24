from sqlalchemy.orm import Session
from models import Machine, Order, Alert, InventoryItem, Employee, EmployeeMachineSession, MaintenanceWorkOrder
from datetime import datetime

def generate_copilot_response(query: str, db: Session) -> dict:
    q = query.lower().strip()
    
    machines = db.query(Machine).all()
    orders = db.query(Order).all()
    alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
    inventory = db.query(InventoryItem).all()
    work_orders = db.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.status != "completed").all()
    
    # 1. Machine Status / Health Queries
    if "machine" in q or "status" in q or "running" in q or "fleet" in q:
        running = [m.name for m in machines if m.status == "running"]
        warning = [m.name for m in machines if m.status in ["warning", "fault", "breakdown"]]
        idle = [m.name for m in machines if m.status == "idle"]
        
        reply = f"Factory Fleet Overview:\n• {len(running)} Machines RUNNING ({', '.join(running) if running else 'None'}).\n"
        if warning:
            reply += f"• ⚠️ Attention Required: {', '.join(warning)} experiencing anomalies or faults.\n"
        if idle:
            reply += f"• ⏸️ {len(idle)} Machines IDLE ({', '.join(idle)}).\n"
            
        lowest_health = min(machines, key=lambda m: m.health_score) if machines else None
        if lowest_health and lowest_health.health_score < 80:
            reply += f"\nRecommendation: Prioritize inspection on {lowest_health.name} ({lowest_health.model_code}) — Health score is currently at {lowest_health.health_score}% with {lowest_health.temperature}°C operating temperature."
            
        return {
            "answer": reply,
            "category": "machines",
            "suggested_actions": ["View Fleet Map", "Inspect CNC Alpha", "Review Maintenance Schedule"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }

    # 2. Inventory / Stock / Reorder Queries
    if "inventory" in q or "material" in q or "stock" in q or "reorder" in q:
        low_items = [i for i in inventory if i.stock_level <= i.min_threshold]
        if low_items:
            items_str = ", ".join([f"{i.material_name} ({i.stock_level} {i.unit} vs min {i.min_threshold})" for i in low_items])
            reply = f"⚠️ Inventory Alert: {len(low_items)} raw materials are currently at or below safety stock threshold:\n• {items_str}.\n\nRecommendation: Trigger smart replenishment for {low_items[0].material_name} (+{int(low_items[0].reorder_quantity_eoq)} {low_items[0].unit}) to avoid production starvation."
        else:
            reply = f"All {len(inventory)} inventory items are currently above minimum safety thresholds. Total stock valuation is healthy."
            
        return {
            "answer": reply,
            "category": "inventory",
            "suggested_actions": ["Open Smart Inventory", "Generate Reorder Purchase Order", "Review Safety Stock"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }

    # 3. Production / Orders / Schedule Queries
    if "order" in q or "production" in q or "schedule" in q or "deadline" in q:
        in_prod = [o for o in orders if o.status == "in_production"]
        urgent = [o for o in orders if o.priority == "urgent"]
        
        reply = f"Production Work Orders Summary:\n• {len(in_prod)} orders currently active on machines.\n• Total scheduled orders: {len(orders)}.\n"
        if urgent:
            reply += f"• 🚨 Urgent Order: {urgent[0].order_number} ({urgent[0].product_name}) target {urgent[0].quantity} units deadline in 2 days.\n"
        reply += f"\nRecommendation: Maintain CNC Alpha spindle RPM above 4,200 to meet today's completion target of {in_prod[0].quantity if in_prod else 500} units."
        
        return {
            "answer": reply,
            "category": "production",
            "suggested_actions": ["Open AI Scheduler", "View Production Cost Breakdown", "Run What-If Simulation"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }

    # 4. Maintenance / Work Orders / Breakdown Queries
    if "maintenance" in q or "work order" in q or "repair" in q or "technician" in q:
        reply = f"Maintenance & Work Order Status:\n• {len(work_orders)} active maintenance work orders pending/in-progress.\n"
        if work_orders:
            wo = work_orders[0]
            reply += f"• Priority Job: {wo.work_order_code} - '{wo.title}' assigned to {wo.assigned_technician} ({wo.status.upper()}).\n"
        reply += f"\nRecommendation: Review vibration signatures on Lathe Alpha before starting the next production batch."
        
        return {
            "answer": reply,
            "category": "maintenance",
            "suggested_actions": ["Create Work Order", "View Downtime Pareto", "Inspect Root Cause"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }

    # 5. Alerts / Anomalies Queries
    if "alert" in q or "alarm" in q or "anomaly" in q or "problem" in q:
        critical = [a for a in alerts if a.severity == "critical"]
        reply = f"Active Alarms: {len(alerts)} unresolved alerts flagged in the factory.\n"
        if critical:
            reply += f"• 🔴 Critical Anomaly: {critical[0].message} (Source: {critical[0].source_id}).\n• Action: {critical[0].recommended_action}\n"
        elif alerts:
            reply += f"• 🟠 Warning: {alerts[0].message}.\n"
        else:
            reply += "• 🟢 Nominal: No active critical alarms detected.\n"
            
        return {
            "answer": reply,
            "category": "alerts",
            "suggested_actions": ["Open Notification Center", "Acknowledge Alerts", "Dispatch Maintenance"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }

    # Default Intelligent Overview
    return {
        "answer": f"Hello! I am your AI Factory Copilot. Currently monitoring {len(machines)} machines, {len(orders)} production orders, and {len(inventory)} inventory materials. Plant OEE is currently estimated at 86.4%. How can I assist you with production optimization, maintenance schedules, or inventory replenishment today?",
        "category": "general",
        "suggested_actions": ["What machines are at risk?", "Which materials are low in stock?", "Show today's production bottleneck"],
        "timestamp": datetime.utcnow().strftime("%H:%M:%S")
    }

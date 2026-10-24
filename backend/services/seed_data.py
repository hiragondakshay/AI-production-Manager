from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from models import (
    User, Machine, Order, ProductionLog, InventoryItem, Alert, Employee, EmployeeShiftLog,
    MachineTelemetry, MachineHealth, EmployeeMachineSession, MachineMaintenanceLog,
    MaintenanceWorkOrder, DowntimeEvent, EnergyLog, AuditLog,
    UserRole, MachineStatus, OrderPriority, OrderStatus, AlertSeverity, MaintenanceRisk, WorkOrderStatus
)
from auth import hash_password

def seed_database_if_empty(db: Session):
    # Check if seed users exist
    if db.query(User).count() == 0:
        print("Seeding database with 5 RBAC User roles...")
        users = [
            User(username="plant_mgr", email="plant.manager@factory.com", hashed_password=hash_password("manager123"), role=UserRole.PLANT_MANAGER.value),
            User(username="prod_mgr", email="production.manager@factory.com", hashed_password=hash_password("prod123"), role=UserRole.PRODUCTION_MANAGER.value),
            User(username="maint_mgr", email="maintenance.manager@factory.com", hashed_password=hash_password("maint123"), role=UserRole.MAINTENANCE_MANAGER.value),
            User(username="quality_mgr", email="quality.manager@factory.com", hashed_password=hash_password("quality123"), role=UserRole.QUALITY_MANAGER.value),
            User(username="operator_1", email="rahul.operator@factory.com", hashed_password=hash_password("operator123"), role=UserRole.OPERATOR.value),
        ]
        db.add_all(users)
        db.commit()

    # Check if inventory items need population
    if db.query(InventoryItem).count() == 0:
        print("Seeding Material Inventory items with EOQ and lead times...")
        inventory_items = [
            InventoryItem(material_name="Mild Steel Sheets", category="Raw Material", stock_level=850.0, min_threshold=300.0, safety_stock=100.0, lead_time_days=4, reorder_quantity_eoq=450.0, unit="kg", unit_cost=14.50),
            InventoryItem(material_name="Aluminum Rods", category="Raw Material", stock_level=420.0, min_threshold=150.0, safety_stock=60.0, lead_time_days=3, reorder_quantity_eoq=300.0, unit="kg", unit_cost=18.20),
            InventoryItem(material_name="Cutting Oil", category="Consumable", stock_level=75.0, min_threshold=25.0, safety_stock=15.0, lead_time_days=2, reorder_quantity_eoq=80.0, unit="L", unit_cost=22.00),
            InventoryItem(material_name="Industrial Bearings", category="Spare Parts", stock_level=18.0, min_threshold=20.0, safety_stock=10.0, lead_time_days=7, reorder_quantity_eoq=50.0, unit="pcs", unit_cost=45.00),
            InventoryItem(material_name="Carbide Cutting Tools", category="Tooling", stock_level=18.0, min_threshold=10.0, safety_stock=8.0, lead_time_days=5, reorder_quantity_eoq=35.0, unit="pcs", unit_cost=85.00),
            InventoryItem(material_name="Stainless Steel Rods", category="Raw Material", stock_level=180.0, min_threshold=100.0, safety_stock=40.0, lead_time_days=6, reorder_quantity_eoq=200.0, unit="kg", unit_cost=28.00),
            InventoryItem(material_name="High-Grade Polymer Resin", category="Plastics", stock_level=120.0, min_threshold=300.0, safety_stock=80.0, lead_time_days=5, reorder_quantity_eoq=400.0, unit="kg", unit_cost=3.20),
            InventoryItem(material_name="Microcontroller IC STM32", category="Electronics", stock_level=0.0, min_threshold=100.0, safety_stock=50.0, lead_time_days=10, reorder_quantity_eoq=500.0, unit="units", unit_cost=14.00),
        ]
        db.add_all(inventory_items)

        for inv in inventory_items:
            if inv.stock_level <= inv.min_threshold:
                db.add(Alert(
                    alert_type="low_stock",
                    severity=AlertSeverity.WARNING.value if inv.stock_level > 0 else AlertSeverity.CRITICAL.value,
                    message=f"LOW INVENTORY ALERT: {inv.material_name} stock ({inv.stock_level} {inv.unit}) is below threshold ({inv.min_threshold} {inv.unit}).",
                    source_id=inv.material_name,
                    recommended_action=f"Reorder +{int(inv.reorder_quantity_eoq)} {inv.unit} of {inv.material_name}."
                ))
        db.commit()

    # Machines
    if db.query(Machine).count() == 0:
        print("Seeding Industry 4.0 Machine Fleet...")
        machines = [
            Machine(name="CNC Alpha", model_code="CNC-001", machine_type="CNC Milling Machine", status=MachineStatus.RUNNING.value, health_score=92.0, temperature=52.4, vibration=1.4, motor_load=68.0, rpm=4500.0, power_consumption=14.2, spindle_load=62.0, operating_hours=1240.0, cycle_time=45.0, downtime_hours=8.5, maintenance_risk=MaintenanceRisk.LOW.value),
            Machine(name="CNC Beta", model_code="CNC-002", machine_type="5-Axis CNC Center", status=MachineStatus.WARNING.value, health_score=78.0, temperature=64.8, vibration=2.9, motor_load=82.0, rpm=5800.0, power_consumption=18.5, spindle_load=79.0, operating_hours=2100.0, cycle_time=52.0, downtime_hours=14.2, maintenance_risk=MaintenanceRisk.MEDIUM.value),
            Machine(name="CNC Gamma", model_code="CNC-003", machine_type="High-Speed CNC Lathe", status=MachineStatus.IDLE.value, health_score=95.0, temperature=41.0, vibration=0.8, motor_load=15.0, rpm=0.0, power_consumption=3.1, spindle_load=0.0, operating_hours=890.0, cycle_time=38.0, downtime_hours=4.0, maintenance_risk=MaintenanceRisk.LOW.value),
            Machine(name="Lathe Alpha", model_code="LTH-001", machine_type="Precision Lathe Machine", status=MachineStatus.FAULT.value, health_score=42.0, temperature=76.2, vibration=4.6, motor_load=94.0, rpm=1200.0, power_consumption=22.0, spindle_load=91.0, operating_hours=3450.0, cycle_time=60.0, downtime_hours=45.0, maintenance_risk=MaintenanceRisk.CRITICAL.value),
            Machine(name="Press Alpha", model_code="PRS-001", machine_type="Heavy Hydraulic Press", status=MachineStatus.RUNNING.value, health_score=89.0, temperature=49.5, vibration=1.6, motor_load=72.0, rpm=1800.0, power_consumption=16.8, spindle_load=65.0, operating_hours=1650.0, cycle_time=30.0, downtime_hours=11.0, maintenance_risk=MaintenanceRisk.LOW.value),
            Machine(name="Laser Alpha", model_code="LSR-001", machine_type="Fiber Laser Cutter 4KW", status=MachineStatus.MAINTENANCE.value, health_score=68.0, temperature=58.0, vibration=2.1, motor_load=45.0, rpm=0.0, power_consumption=8.4, spindle_load=0.0, operating_hours=2890.0, cycle_time=25.0, downtime_hours=28.0, maintenance_risk=MaintenanceRisk.HIGH.value),
        ]
        db.add_all(machines)
        db.commit()

    # Employees
    if db.query(Employee).count() == 0:
        employees = [
            Employee(name="Rahul Patil", employee_code="EMP-101", department="Machining Operations", role_title="Senior CNC Milling Specialist", assigned_machine_id=1, efficiency_rating=96.2, quality_score=99.1),
            Employee(name="Sarah Chen", employee_code="EMP-102", department="5-Axis Precision Ops", role_title="5-Axis CNC Machinist", assigned_machine_id=2, efficiency_rating=93.8, quality_score=97.5),
            Employee(name="Marcus Vance", employee_code="EMP-103", department="Assembly & Lathe", role_title="Precision Lathe Operator", assigned_machine_id=3, efficiency_rating=91.4, quality_score=96.0),
            Employee(name="Elena Rostova", employee_code="EMP-104", department="Fabrication & Press", role_title="Hydraulics Press Engineer", assigned_machine_id=4, efficiency_rating=95.0, quality_score=98.4),
            Employee(name="David Miller", employee_code="EMP-105", department="Metal Forming", role_title="Heavy Press Specialist", assigned_machine_id=5, efficiency_rating=89.5, quality_score=94.2),
            Employee(name="Vikram Patel", employee_code="EMP-106", department="Laser Fabrication", role_title="Laser Cutting Operator", assigned_machine_id=6, efficiency_rating=94.1, quality_score=98.8),
        ]
        db.add_all(employees)
        db.commit()

    # Orders
    now = datetime.utcnow()
    if db.query(Order).count() == 0:
        orders = [
            Order(order_number="ORDER-1045", product_name="Aerospace Turbine Bracket", quantity=500, priority=OrderPriority.URGENT.value, deadline=now + timedelta(days=2), status=OrderStatus.IN_PRODUCTION.value, assigned_machine_id=1, material_cost=1725.0, labor_cost=355.5, energy_cost=158.0, machine_cost=205.5, total_cost=2444.0),
            Order(order_number="ORDER-1046", product_name="Automotive Dashboard Casing", quantity=1200, priority=OrderPriority.HIGH.value, deadline=now + timedelta(days=4), status=OrderStatus.IN_PRODUCTION.value, assigned_machine_id=2, material_cost=4140.0, labor_cost=853.3, energy_cost=379.2, machine_cost=493.3, total_cost=5865.8),
            Order(order_number="ORDER-1047", product_name="Medical Control Circuit Board", quantity=2500, priority=OrderPriority.HIGH.value, deadline=now + timedelta(days=3), status=OrderStatus.SCHEDULED.value, assigned_machine_id=4, material_cost=8625.0, labor_cost=1777.7, energy_cost=790.0, machine_cost=1027.7, total_cost=12220.4),
            Order(order_number="ORDER-1048", product_name="Chassis Frame Beam", quantity=350, priority=OrderPriority.MEDIUM.value, deadline=now + timedelta(days=7), status=OrderStatus.PENDING.value, assigned_machine_id=None, material_cost=1207.5, labor_cost=248.8, energy_cost=110.6, machine_cost=143.8, total_cost=1710.7),
        ]
        db.add_all(orders)
        db.commit()

    # Maintenance Work Orders
    if db.query(MaintenanceWorkOrder).count() == 0:
        print("Seeding Maintenance Work Orders...")
        wos = [
            MaintenanceWorkOrder(work_order_code="WO-0901", machine_id=4, title="Spindle Bearing Replacement", description="Vibration telemetry triggered high risk warning. Replace front angular contact bearings.", priority="high", status="in_progress", assigned_technician="Carlos Santana", estimated_hours=3.5, cost=380.0),
            MaintenanceWorkOrder(work_order_code="WO-0902", machine_id=2, title="Coolant Filter Flush & Refill", description="Thermal delta rose above 64°C. Flush cooling line filters and replenish coolant reservoir.", priority="medium", status="pending", assigned_technician="David Miller", estimated_hours=1.5, cost=120.0),
            MaintenanceWorkOrder(work_order_code="WO-0903", machine_id=6, title="Laser Optical Lens Alignment", description="Optical focal lens inspection and nitrogen gas pressure sensor calibration.", priority="urgent", status="completed", assigned_technician="Elena Rostova", estimated_hours=2.0, actual_hours=1.8, cost=290.0, resolution_notes="Completed 4-point laser beam alignment. Replaced protective lens cover."),
        ]
        db.add_all(wos)
        db.commit()

    # Downtime Events for Pareto Analysis
    if db.query(DowntimeEvent).count() == 0:
        print("Seeding Historical Downtime Events for Pareto Analysis...")
        downtimes = [
            DowntimeEvent(machine_id=4, category="Mechanical", reason="Spindle bearing fretting & excessive vibration", duration_minutes=120.0, production_loss_units=85, cost_impact=1420.0, start_time=now - timedelta(days=1, hours=4)),
            DowntimeEvent(machine_id=2, category="Cooling", reason="Coolant jacket filter blockage & thermal spike", duration_minutes=75.0, production_loss_units=48, cost_impact=680.0, start_time=now - timedelta(days=2, hours=6)),
            DowntimeEvent(machine_id=6, category="Tooling", reason="Fiber laser focal optic contamination", duration_minutes=45.0, production_loss_units=32, cost_impact=450.0, start_time=now - timedelta(days=3, hours=2)),
            DowntimeEvent(machine_id=5, category="Electrical", reason="Hydraulic servo drive voltage sag", duration_minutes=35.0, production_loss_units=24, cost_impact=380.0, start_time=now - timedelta(days=4, hours=5)),
            DowntimeEvent(machine_id=1, category="Material", reason="Raw bar stock feeder jam", duration_minutes=25.0, production_loss_units=18, cost_impact=220.0, start_time=now - timedelta(days=5, hours=3)),
            DowntimeEvent(machine_id=3, category="Operator", reason="Shift changeover tooling calibration check", duration_minutes=20.0, production_loss_units=12, cost_impact=160.0, start_time=now - timedelta(days=6, hours=1)),
        ]
        db.add_all(downtimes)
        db.commit()

    # Audit Logs
    if db.query(AuditLog).count() == 0:
        logs = [
            AuditLog(username="plant_mgr", role="plant_manager", action="Logged In", module="Authentication", details="Successful password authentication via AES-256 armored session"),
            AuditLog(username="prod_mgr", role="production_manager", action="Ran AI Auto-Scheduler", module="Scheduler", details="Optimized order priority queue for 4 work orders"),
            AuditLog(username="maint_mgr", role="maintenance_manager", action="Created Work Order WO-0901", module="Maintenance", details="Dispatched Carlos Santana to inspect Lathe Alpha vibration"),
            AuditLog(username="plant_mgr", role="plant_manager", action="Triggered Inventory Reorder", module="Inventory", details="Generated replenishment purchase order for Mild Steel Sheets (+400 kg)"),
        ]
        db.add_all(logs)
        db.commit()

    return {"message": "Database seeded successfully with enterprise Industry 4.0 data."}

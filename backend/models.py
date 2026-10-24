from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    PLANT_MANAGER = "plant_manager"
    PRODUCTION_MANAGER = "production_manager"
    MAINTENANCE_MANAGER = "maintenance_manager"
    QUALITY_MANAGER = "quality_manager"
    OPERATOR = "operator"

class MachineStatus(str, enum.Enum):
    RUNNING = "running"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    WARNING = "warning"
    FAULT = "fault"
    OFFLINE = "offline"
    BREAKDOWN = "breakdown"

class OrderPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PRODUCTION = "in_production"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class MaintenanceRisk(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class WorkOrderStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default=UserRole.OPERATOR.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    model_code = Column(String(50), nullable=False)
    machine_type = Column(String(50), default="CNC Milling Machine")
    status = Column(String(30), default=MachineStatus.IDLE.value)
    health_score = Column(Float, default=92.0) # 0.0 to 100.0 %
    temperature = Column(Float, default=45.0) # degrees C
    vibration = Column(Float, default=1.2) # mm/s
    motor_load = Column(Float, default=65.0) # %
    rpm = Column(Float, default=4200.0) # RPM
    power_consumption = Column(Float, default=12.5) # kW
    spindle_load = Column(Float, default=58.0) # %
    operating_hours = Column(Float, default=1240.0)
    cycle_time = Column(Float, default=45.0) # seconds per part
    downtime_hours = Column(Float, default=12.5)
    maintenance_risk = Column(String(20), default=MaintenanceRisk.LOW.value)
    last_maintenance = Column(DateTime, default=datetime.utcnow)
    next_maintenance = Column(DateTime, default=datetime.utcnow)
    maintenance_cost = Column(Float, default=1450.0) # USD

    orders = relationship("Order", back_populates="assigned_machine")
    production_logs = relationship("ProductionLog", back_populates="machine")
    assigned_employees = relationship("Employee", back_populates="assigned_machine")
    telemetry_history = relationship("MachineTelemetry", back_populates="machine", cascade="all, delete-orphan")
    health_history = relationship("MachineHealth", back_populates="machine", cascade="all, delete-orphan")
    sessions = relationship("EmployeeMachineSession", back_populates="machine", cascade="all, delete-orphan")
    maintenance_history = relationship("MachineMaintenanceLog", back_populates="machine", cascade="all, delete-orphan")
    work_orders = relationship("MaintenanceWorkOrder", back_populates="machine", cascade="all, delete-orphan")
    downtime_events = relationship("DowntimeEvent", back_populates="machine", cascade="all, delete-orphan")
    energy_logs = relationship("EnergyLog", back_populates="machine", cascade="all, delete-orphan")

class MachineTelemetry(Base):
    __tablename__ = "machine_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    temperature = Column(Float, default=45.0)
    vibration = Column(Float, default=1.2)
    motor_load = Column(Float, default=65.0)
    rpm = Column(Float, default=4200.0)
    power_consumption = Column(Float, default=12.5)
    spindle_load = Column(Float, default=58.0)
    operating_hours = Column(Float, default=0.0)
    cycle_time = Column(Float, default=45.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="telemetry_history")

class MachineHealth(Base):
    __tablename__ = "machine_health"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    health_score = Column(Float, default=92.0)
    temp_health = Column(String(20), default="Healthy")
    vibration_health = Column(String(20), default="Healthy")
    motor_health = Column(String(20), default="Healthy")
    spindle_health = Column(String(20), default="Healthy")
    bearing_health = Column(String(20), default="Healthy")
    cooling_health = Column(String(20), default="Healthy")
    hydraulic_health = Column(String(20), default="Healthy")
    electrical_health = Column(String(20), default="Healthy")
    status_level = Column(String(20), default="Excellent")
    timestamp = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="health_history")

class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(Integer, primary_key=True, index=True)
    work_order_code = Column(String(50), unique=True, index=True, nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default=WorkOrderStatus.PENDING.value)
    assigned_technician = Column(String(100), default="Carlos Santana")
    estimated_hours = Column(Float, default=2.5)
    actual_hours = Column(Float, default=0.0)
    cost = Column(Float, default=180.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    machine = relationship("Machine", back_populates="work_orders")
    alert = relationship("Alert")

class DowntimeEvent(Base):
    __tablename__ = "downtime_events"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    category = Column(String(50), nullable=False) # Mechanical, Electrical, Tooling, Operator, Material
    reason = Column(String(200), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, default=45.0)
    production_loss_units = Column(Integer, default=30)
    cost_impact = Column(Float, default=420.0)
    shift = Column(String(20), default="Morning Shift")
    resolved_by = Column(String(100), nullable=True)

    machine = relationship("Machine", back_populates="downtime_events")

class EnergyLog(Base):
    __tablename__ = "energy_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    kwh_consumed = Column(Float, default=14.2)
    voltage = Column(Float, default=400.0)
    current_amp = Column(Float, default=35.5)
    power_factor = Column(Float, default=0.92)
    energy_cost = Column(Float, default=2.13) # USD per interval
    co2_kg = Column(Float, default=5.6)
    timestamp = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="energy_logs")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    role = Column(String(30), nullable=False)
    action = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)

class EmployeeMachineSession(Base):
    __tablename__ = "employee_machine_sessions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    operation = Column(String(100), default="CNC Milling & Precision Contouring")
    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    target_quantity = Column(Integer, default=500)
    completed_quantity = Column(Integer, default=320)
    shift = Column(String(20), default="Morning Shift")
    status = Column(String(20), default="active")

    employee = relationship("Employee")
    machine = relationship("Machine", back_populates="sessions")
    order = relationship("Order")

class MachineMaintenanceLog(Base):
    __tablename__ = "machine_maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    maintenance_date = Column(DateTime, default=datetime.utcnow)
    maintenance_type = Column(String(50), default="Preventive Calibration")
    description = Column(String(255), nullable=False)
    cost = Column(Float, default=250.0)
    performed_by = Column(String(100), default="Industrial Engineering Team")

    machine = relationship("Machine", back_populates="maintenance_history")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(String(20), default=OrderPriority.MEDIUM.value)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(30), default=OrderStatus.PENDING.value)
    assigned_machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    material_cost = Column(Float, default=1200.0)
    labor_cost = Column(Float, default=450.0)
    energy_cost = Column(Float, default=180.0)
    machine_cost = Column(Float, default=320.0)
    total_cost = Column(Float, default=2150.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_machine = relationship("Machine", back_populates="orders")
    production_logs = relationship("ProductionLog", back_populates="order")

class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    units_produced = Column(Integer, default=0)
    defective_units = Column(Integer, default=0)
    shift = Column(String(20), default="morning")
    downtime_minutes = Column(Float, default=0.0)
    downtime_reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="production_logs")
    order = relationship("Order", back_populates="production_logs")

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    material_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    stock_level = Column(Float, nullable=False)
    min_threshold = Column(Float, nullable=False)
    safety_stock = Column(Float, default=80.0)
    lead_time_days = Column(Integer, default=5)
    reorder_quantity_eoq = Column(Float, default=350.0)
    unit = Column(String(20), default="kg")
    unit_cost = Column(Float, default=0.0)
    last_reordered = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default=AlertSeverity.WARNING.value)
    message = Column(String(255), nullable=False)
    source_id = Column(String(50), nullable=True)
    is_resolved = Column(Boolean, default=False)
    recommended_action = Column(String(255), default="Inspect machine sensors and verify coolant level.")
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    employee_code = Column(String(30), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False)
    role_title = Column(String(50), nullable=False)
    assigned_machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    efficiency_rating = Column(Float, default=94.5)
    quality_score = Column(Float, default=98.2)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_machine = relationship("Machine", back_populates="assigned_employees")
    shift_logs = relationship("EmployeeShiftLog", back_populates="employee")

class EmployeeShiftLog(Base):
    __tablename__ = "employee_shift_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    shift_date = Column(String(20), nullable=False)
    clock_in_time = Column(DateTime, default=datetime.utcnow)
    clock_out_time = Column(DateTime, nullable=True)
    hours_worked = Column(Float, default=0.0)
    units_produced = Column(Integer, default=0)
    defective_units = Column(Integer, default=0)
    attendance_status = Column(String(30), default="present")

    employee = relationship("Employee", back_populates="shift_logs")
    machine = relationship("Machine")

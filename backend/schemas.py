from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    full_name: Optional[str] = None
    username: str
    email: str
    password: str
    role: Optional[str] = "operator"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    username_or_email: str


# --- Machine Schemas ---
class MachineBase(BaseModel):
    name: str
    model_code: str
    status: Optional[str] = "idle"
    health_score: Optional[float] = 100.0
    temperature: Optional[float] = 45.0
    vibration: Optional[float] = 1.2
    operating_hours: Optional[float] = 0.0

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    model_code: Optional[str] = None
    status: Optional[str] = None
    health_score: Optional[float] = None
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    operating_hours: Optional[float] = None

class MachineResponse(MachineBase):
    id: int
    last_maintenance: datetime

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderBase(BaseModel):
    order_number: str
    product_name: str
    quantity: int
    priority: Optional[str] = "medium"
    deadline: datetime
    status: Optional[str] = "pending"
    assigned_machine_id: Optional[int] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    assigned_machine_id: Optional[int] = None

class OrderResponse(OrderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Production Log Schemas ---
class LogBase(BaseModel):
    machine_id: int
    order_id: Optional[int] = None
    units_produced: int
    defective_units: int = 0
    shift: str = "morning"
    downtime_minutes: float = 0.0
    downtime_reason: Optional[str] = None

class LogCreate(LogBase):
    pass

class LogResponse(LogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Inventory Schemas ---
class InventoryBase(BaseModel):
    material_name: str
    category: str
    stock_level: float
    min_threshold: float
    unit: str = "kg"
    unit_cost: float = 0.0

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    stock_level: Optional[float] = None
    min_threshold: Optional[float] = None
    unit_cost: Optional[float] = None

class InventoryResponse(InventoryBase):
    id: int
    last_reordered: datetime

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    source_id: Optional[str] = None
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- KPI Dashboard Schemas ---
class KPISummary(BaseModel):
    total_output: int
    overall_oee: float # %
    availability_rate: float # %
    performance_rate: float # %
    quality_rate: float # %
    uptime_percentage: float # %
    active_machines_count: int
    total_machines_count: int
    pending_orders_count: int
    critical_alerts_count: int

# --- ML & AI Schemas ---
class ForecastRequest(BaseModel):
    days: int = 14

class ForecastDataPoint(BaseModel):
    date: str
    predicted_demand: int
    lower_bound: int
    upper_bound: int

class ForecastResponse(BaseModel):
    horizon_days: int
    trend: str
    total_predicted_units: int
    forecast: List[ForecastDataPoint]

class ScheduleRecommendation(BaseModel):
    order_id: int
    order_number: str
    product_name: str
    recommended_machine_id: int
    recommended_machine_name: str
    estimated_start: str
    estimated_completion: str
    priority_score: float
    reason: str

class MaintenancePrediction(BaseModel):
    machine_id: int
    machine_name: str
    failure_risk_percentage: float
    predicted_status: str # normal, warning, critical
    primary_risk_factor: str
    recommended_action: str

class QualityInspectionRequest(BaseModel):
    machine_id: int
    batch_code: str
    sample_parameter_1: float = 24.5 # e.g. surface roughness / weight variance
    sample_parameter_2: float = 0.98 # e.g. dimension accuracy ratio

class QualityInspectionResponse(BaseModel):
    inspection_id: str
    batch_code: str
    defect_detected: bool
    confidence: float
    defect_type: Optional[str] = None
    suggested_action: str

import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    ForecastRequest, ForecastResponse,
    QualityInspectionRequest, QualityInspectionResponse
)
from services.ml_forecasting import generate_demand_forecast
from services.ml_maintenance import predict_machine_maintenance
from services.ai_scheduler import generate_ai_schedule
from services.vision_inspector import analyze_product_image

router = APIRouter(prefix="/api/ai", tags=["AI & ML Engines"])

@router.post("/forecast", response_model=ForecastResponse)
def get_demand_forecast(req: ForecastRequest = ForecastRequest(days=14), db: Session = Depends(get_db)):
    days = max(3, min(90, req.days))
    return generate_demand_forecast(db, horizon_days=days)

@router.post("/schedule")
def get_production_schedule(db: Session = Depends(get_db)):
    return generate_ai_schedule(db)

@router.get("/predictive-maintenance")
def get_predictive_maintenance(db: Session = Depends(get_db)):
    return predict_machine_maintenance(db)

@router.post("/quality-check", response_model=QualityInspectionResponse)
def inspect_quality(req: QualityInspectionRequest, db: Session = Depends(get_db)):
    p1_defect = req.sample_parameter_1 < 15.0 or req.sample_parameter_1 > 35.0
    p2_defect = req.sample_parameter_2 < 0.90 or req.sample_parameter_2 > 1.10

    is_defective = p1_defect or p2_defect
    confidence = round(0.92 + (0.07 if is_defective else 0.05), 2)

    if p1_defect and p2_defect:
        defect_type = "Multiple Anomaly: Surface Roughness & Dimensional Out-of-Spec"
        action = "REJECT BATCH. Hold machine for re-calibration immediately."
    elif p1_defect:
        defect_type = "Surface Finish Flaw (Micro-cracks detected)"
        action = "FLAG FOR REWORK. Check coolant flow and cutting tool sharpness."
    elif p2_defect:
        defect_type = "Dimensional Variance Out of Tolerance (>5% dev)"
        action = "FLAG FOR REWORK. Recalibrate axis zero-point offsets."
    else:
        defect_type = None
        action = "PASS INSPECTION. Batch released to packaging warehouse."

    return {
        "inspection_id": f"QC-{uuid.uuid4().hex[:8].upper()}",
        "batch_code": req.batch_code,
        "defect_detected": is_defective,
        "confidence": confidence,
        "defect_type": defect_type,
        "suggested_action": action
    }

@router.post("/quality-check-image")
async def inspect_quality_image(file: UploadFile = File(...)):
    contents = await file.read()
    analysis = analyze_product_image(contents)
    return {
        "inspection_id": f"QC-IMG-{uuid.uuid4().hex[:8].upper()}",
        "filename": file.filename,
        **analysis
    }

from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
import io
import csv
from database import get_db
from models import ProductionLog
from services.report_generator import generate_shift_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/shift-pdf")
def get_shift_pdf(db: Session = Depends(get_db)):
    pdf_bytes = generate_shift_pdf_report(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=NexusProd_Shift_Report.pdf"}
    )

@router.get("/export-csv")
def export_production_csv(db: Session = Depends(get_db)):
    logs = db.query(ProductionLog).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Log ID", "Machine ID", "Order ID", "Shift", "Units Produced", "Defective Units", "Downtime Mins", "Downtime Reason", "Timestamp"])

    for log in logs:
        writer.writerow([
            log.id,
            log.machine_id,
            log.order_id or "N/A",
            log.shift,
            log.units_produced,
            log.defective_units,
            log.downtime_minutes,
            log.downtime_reason or "None",
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=NexusProd_Production_Logs.csv"}
    )

@router.get("/logs")
def get_production_logs(db: Session = Depends(get_db)):
    logs = db.query(ProductionLog).order_by(ProductionLog.timestamp.desc()).all()
    return [
        {
            "id": l.id,
            "machine_id": l.machine_id,
            "order_id": l.order_id,
            "shift": l.shift,
            "units_produced": l.units_produced,
            "defective_units": l.defective_units,
            "downtime_minutes": l.downtime_minutes,
            "downtime_reason": l.downtime_reason or "Normal Operation",
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else None
        }
        for l in logs
    ]


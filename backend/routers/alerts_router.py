from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Alert
from schemas import AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(resolved: bool = False, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if not resolved:
        query = query.filter(Alert.is_resolved == False)
    return query.order_by(Alert.created_at.desc()).all()

@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return alert

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import InventoryItem, Alert, AlertSeverity
from schemas import InventoryResponse, InventoryCreate, InventoryUpdate

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryResponse])
def list_inventory(db: Session = Depends(get_db)):
    return db.query(InventoryItem).all()

@router.post("", response_model=InventoryResponse)
def create_item(item_in: InventoryCreate, db: Session = Depends(get_db)):
    item = InventoryItem(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=InventoryResponse)
def update_item(item_id: int, update_in: InventoryUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(item, field, val)

    # Check if stock dropped below minimum threshold
    if item.stock_level < item.min_threshold:
        db.add(Alert(
            alert_type="low_stock",
            severity=AlertSeverity.WARNING.value,
            message=f"LOW INVENTORY ALERT: {item.material_name} stock ({item.stock_level} {item.unit}) below threshold ({item.min_threshold} {item.unit}).",
            source_id=item.material_name
        ))

    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/reorder", response_model=InventoryResponse)
def reorder_material(item_id: int, add_quantity: float = 500.0, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.stock_level += add_quantity
    item.last_reordered = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

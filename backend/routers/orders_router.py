from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Order
from schemas import OrderResponse, OrderCreate, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("", response_model=List[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.deadline.asc()).all()

@router.post("", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # Check duplicate order number
    existing = db.query(Order).filter(Order.order_number == order_in.order_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order number already exists")

    order = Order(**order_in.dict())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, update_in: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(order, field, val)

    db.commit()
    db.refresh(order)
    return order

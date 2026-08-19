from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Service, ServiceCategory, Client, ServiceTaker, AuditLog
from app.schemas.schemas import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceCategorySchema
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/services", tags=["services"])

# --- Categories ---
@router.get("/categories", response_model=List[ServiceCategorySchema])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ServiceCategory).filter(ServiceCategory.active == True).all()

@router.post("/categories", response_model=ServiceCategorySchema)
def create_category(cat: ServiceCategorySchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(ServiceCategory).filter(ServiceCategory.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    db_cat = ServiceCategory(name=cat.name, description=cat.description, active=cat.active)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# --- Services ---
@router.get("", response_model=List[ServiceResponse])
def get_services(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    services = db.query(Service).order_by(Service.created_at.desc()).all()
    res = []
    for s in services:
        client = db.query(Client).filter(Client.id == s.client_id).first()
        cat = db.query(ServiceCategory).filter(ServiceCategory.id == s.category_id).first()
        taker = db.query(ServiceTaker).filter(ServiceTaker.id == s.service_taker_id).first() if s.service_taker_id else None
        
        item = ServiceResponse.from_orm(s)
        item.client_name = client.name if client else "N/A"
        item.client_company = client.company_name if client else "N/A"
        item.category_name = cat.name if cat else "N/A"
        item.service_taker_name = taker.name if taker else "N/A"
        res.append(item)
    return res

@router.post("", response_model=ServiceResponse)
def create_service(service_in: ServiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == service_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Selected client not found")

    count = db.query(Service).count() + 1
    service_code = f"AUR-SRV-{count:04d}"

    # Auto Calculations
    amt = service_in.amount
    disc = service_in.discount
    tax = service_in.tax_amount
    final_amt = amt - disc + tax
    rec = service_in.amount_received or 0.0
    pending = max(0.0, final_amt - rec)

    status = "Pending"
    if rec >= final_amt and final_amt > 0:
        status = "Paid"
    elif rec > 0 and pending > 0:
        status = "Partially Paid"
    
    # Check overdue
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if service_in.due_date and service_in.due_date < today_str and status != "Paid":
        status = "Overdue"

    service = Service(
        service_code=service_code,
        name=service_in.name,
        category_id=service_in.category_id,
        client_id=service_in.client_id,
        service_taker_id=service_in.service_taker_id,
        description=service_in.description,
        start_date=service_in.start_date or today_str,
        due_date=service_in.due_date,
        completion_date=service_in.completion_date,
        amount=amt,
        discount=disc,
        tax_amount=tax,
        final_amount=final_amt,
        amount_received=rec,
        pending_amount=pending,
        payment_status=status,
        payment_method=service_in.payment_method,
        notes=service_in.notes
    )
    db.add(service)

    # Recalculate client statistics
    client.total_services = (client.total_services or 0) + 1
    client.total_revenue = (client.total_revenue or 0.0) + final_amt
    client.paid_amount = (client.paid_amount or 0.0) + rec
    client.outstanding_amount = (client.outstanding_amount or 0.0) + pending

    db.commit()
    db.refresh(service)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_SERVICE",
        record_type="Service",
        record_id=str(service.id),
        details=f"Created service '{service.name}' for client '{client.company_name}' (Value: ₹{final_amt})"
    )
    db.add(audit)
    db.commit()

    cat = db.query(ServiceCategory).filter(ServiceCategory.id == service.category_id).first()
    taker = db.query(ServiceTaker).filter(ServiceTaker.id == service.service_taker_id).first() if service.service_taker_id else None

    res = ServiceResponse.from_orm(service)
    res.client_name = client.name
    res.client_company = client.company_name
    res.category_name = cat.name if cat else "N/A"
    res.service_taker_name = taker.name if taker else "N/A"
    return res

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, service_in: ServiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    old_client_id = service.client_id
    old_final = service.final_amount
    old_rec = service.amount_received
    old_pending = service.pending_amount

    update_data = service_in.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(service, k, v)

    # Recalculate
    amt = service.amount
    disc = service.discount
    tax = service.tax_amount
    service.final_amount = amt - disc + tax
    rec = service.amount_received
    service.pending_amount = max(0.0, service.final_amount - rec)

    if rec >= service.final_amount and service.final_amount > 0:
        service.payment_status = "Paid"
    elif rec > 0 and service.pending_amount > 0:
        service.payment_status = "Partially Paid"

    # Adjust client figures
    client = db.query(Client).filter(Client.id == service.client_id).first()
    if client:
        client.total_revenue = max(0.0, (client.total_revenue or 0.0) - old_final + service.final_amount)
        client.paid_amount = max(0.0, (client.paid_amount or 0.0) - old_rec + rec)
        client.outstanding_amount = max(0.0, (client.outstanding_amount or 0.0) - old_pending + service.pending_amount)

    db.commit()
    db.refresh(service)

    cat = db.query(ServiceCategory).filter(ServiceCategory.id == service.category_id).first()
    taker = db.query(ServiceTaker).filter(ServiceTaker.id == service.service_taker_id).first() if service.service_taker_id else None

    res = ServiceResponse.from_orm(service)
    res.client_name = client.name if client else "N/A"
    res.client_company = client.company_name if client else "N/A"
    res.category_name = cat.name if cat else "N/A"
    res.service_taker_name = taker.name if taker else "N/A"
    return res

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    client = db.query(Client).filter(Client.id == service.client_id).first()
    if client:
        client.total_services = max(0, (client.total_services or 0) - 1)
        client.total_revenue = max(0.0, (client.total_revenue or 0.0) - service.final_amount)
        client.paid_amount = max(0.0, (client.paid_amount or 0.0) - service.amount_received)
        client.outstanding_amount = max(0.0, (client.outstanding_amount or 0.0) - service.pending_amount)

    db.delete(service)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DELETE_SERVICE",
        record_type="Service",
        record_id=str(service_id),
        details=f"Deleted service ID {service_id}"
    )
    db.add(audit)
    db.commit()

    return {"message": "Service deleted successfully"}

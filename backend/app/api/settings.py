from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import json
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import CompanySetting, User, Client, Service, Invoice, InvoiceItem, Payment, Expense, AuditLog, Notification
from app.api.auth import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["settings"])

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_gstin: Optional[str] = None
    company_address: Optional[str] = None
    currency_symbol: Optional[str] = None
    currency_code: Optional[str] = None

@router.get("/company")
def get_company_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(CompanySetting).all()
    res = {
        "company_name": settings.COMPANY_NAME,
        "company_website": settings.COMPANY_WEBSITE,
        "company_email": settings.COMPANY_EMAIL,
        "company_phone": settings.COMPANY_PHONE,
        "company_gstin": settings.COMPANY_GSTIN,
        "company_address": settings.COMPANY_ADDRESS,
        "currency_symbol": settings.CURRENCY_SYMBOL,
        "currency_code": settings.CURRENCY_CODE
    }
    for item in items:
        res[item.key] = item.value
    return res

@router.put("/company")
def update_company_settings(payload: CompanyProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        existing = db.query(CompanySetting).filter(CompanySetting.key == key).first()
        if existing:
            existing.value = value
        else:
            db.add(CompanySetting(key=key, value=value, description="Updated via Settings UI"))
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="COMPANY_PROFILE_UPDATE",
        record_type="CompanySetting",
        details=f"Updated company profile fields: {', '.join(updates.keys())}"
    )
    db.add(audit)
    db.commit()
    return {"message": "Company profile updated successfully"}

@router.get("/backup")
def export_database_backup(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    backup_data = {
        "export_date": settings.COMPANY_NAME,
        "users": [{"id": u.id, "email": u.email, "username": u.username, "full_name": u.full_name} for u in db.query(User).all()],
        "clients": [{"id": c.id, "code": c.client_code, "name": c.name, "company": c.company_name, "revenue": c.total_revenue} for c in db.query(Client).all()],
        "services": [{"id": s.id, "code": s.service_code, "name": s.name, "amount": s.final_amount, "status": s.payment_status} for s in db.query(Service).all()],
        "invoices": [{"id": i.id, "number": i.invoice_number, "total": i.grand_total, "paid": i.amount_paid, "status": i.status} for i in db.query(Invoice).all()],
        "payments": [{"id": p.id, "code": p.payment_code, "amount": p.amount, "method": p.payment_method} for p in db.query(Payment).all()],
        "expenses": [{"id": e.id, "code": e.expense_code, "amount": e.amount, "desc": e.description} for e in db.query(Expense).all()]
    }
    json_str = json.dumps(backup_data, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=Auralix_RevenueHub_Backup.json"}
    )

@router.post("/reset-data")
def reset_sample_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Payment).delete()
    db.query(InvoiceItem).delete()
    db.query(Invoice).delete()
    db.query(Service).delete()
    db.query(Client).delete()
    db.query(Expense).delete()
    db.query(AuditLog).delete()
    db.query(Notification).delete()
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CLEAR_SAMPLE_DATA",
        record_type="System",
        details="Cleared all sample business data (clients, services, invoices, payments, expenses)."
    )
    db.add(audit)
    db.add(Notification(
        title="System Reset Executed",
        message="All sample financial and client data cleared successfully.",
        type="warning"
    ))
    db.commit()

    return {"message": "All sample data cleared successfully. System ready for live production entry."}

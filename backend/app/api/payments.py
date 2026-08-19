from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Payment, Invoice, Client, Service, AuditLog
from app.schemas.schemas import PaymentCreate, PaymentResponse
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    res = []
    for p in payments:
        inv = db.query(Invoice).filter(Invoice.id == p.invoice_id).first()
        client = db.query(Client).filter(Client.id == p.client_id).first()
        
        item = PaymentResponse.from_orm(p)
        item.invoice_number = inv.invoice_number if inv else "N/A"
        item.client_name = client.company_name if client else "N/A"
        res.append(item)
    return res

@router.post("", response_model=PaymentResponse)
def record_payment(pay_in: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == pay_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Selected invoice not found")

    if pay_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    count = db.query(Payment).count() + 1
    payment_code = f"AUR-PAY-{count:04d}"

    payment = Payment(
        payment_code=payment_code,
        invoice_id=invoice.id,
        client_id=invoice.client_id,
        amount=pay_in.amount,
        payment_date=pay_in.payment_date or datetime.utcnow().strftime("%Y-%m-%d"),
        payment_method=pay_in.payment_method,
        transaction_id=pay_in.transaction_id,
        notes=pay_in.notes,
        recorded_by=current_user.full_name
    )
    db.add(payment)

    # 1. Recalculate Invoice
    invoice.amount_paid = (invoice.amount_paid or 0.0) + pay_in.amount
    invoice.balance_due = max(0.0, invoice.grand_total - invoice.amount_paid)
    
    if invoice.balance_due <= 0:
        invoice.status = "Paid"
    elif invoice.amount_paid > 0:
        invoice.status = "Partially Paid"

    # 2. Recalculate Client
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        client.paid_amount = (client.paid_amount or 0.0) + pay_in.amount
        client.outstanding_amount = max(0.0, (client.outstanding_amount or 0.0) - pay_in.amount)

    # 3. Recalculate Linked Service if any
    if invoice.service_id:
        service = db.query(Service).filter(Service.id == invoice.service_id).first()
        if service:
            service.amount_received = (service.amount_received or 0.0) + pay_in.amount
            service.pending_amount = max(0.0, service.final_amount - service.amount_received)
            if service.pending_amount <= 0:
                service.payment_status = "Paid"
            elif service.amount_received > 0:
                service.payment_status = "Partially Paid"

    db.commit()
    db.refresh(payment)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="RECORD_PAYMENT",
        record_type="Payment",
        record_id=str(payment.id),
        details=f"Recorded payment ₹{pay_in.amount} for invoice #{invoice.invoice_number} ({pay_in.payment_method})"
    )
    db.add(audit)
    db.commit()

    res = PaymentResponse.from_orm(payment)
    res.invoice_number = invoice.invoice_number
    res.client_name = client.company_name if client else "N/A"
    return res

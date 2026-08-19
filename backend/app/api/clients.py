from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Client, Service, Invoice, Payment, AuditLog
from app.schemas.schemas import ClientCreate, ClientUpdate, ClientResponse
from app.api.auth import get_current_user, User
from app.utils.pdf_generator import generate_report_pdf

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    clients = db.query(Client).order_by(Client.created_at.desc()).all()
    return clients

@router.post("", response_model=ClientResponse)
def create_client(client_in: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Client).count() + 1
    client_code = f"AUR-CLI-{count:04d}"
    
    client = Client(
        client_code=client_code,
        name=client_in.name,
        company_name=client_in.company_name,
        email=client_in.email,
        phone=client_in.phone,
        address=client_in.address,
        city=client_in.city,
        state=client_in.state,
        country=client_in.country or "India",
        gstin=client_in.gstin,
        notes=client_in.notes
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_CLIENT",
        record_type="Client",
        record_id=str(client.id),
        details=f"Created client '{client.company_name}' ({client.client_code})"
    )
    db.add(audit)
    db.commit()

    return client

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, client_in: ClientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(client, field, val)

    client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE_CLIENT",
        record_type="Client",
        record_id=str(client.id),
        details=f"Updated client '{client.company_name}'"
    )
    db.add(audit)
    db.commit()

    return client

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    company_name = client.company_name
    db.delete(client)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DELETE_CLIENT",
        record_type="Client",
        record_id=str(client_id),
        details=f"Deleted client '{company_name}'"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Client '{company_name}' deleted successfully"}

@router.get("/{client_id}/statement/pdf")
def export_client_statement_pdf(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    services = db.query(Service).filter(Service.client_id == client.id).all()
    invoices = db.query(Invoice).filter(Invoice.client_id == client.id).all()
    payments = db.query(Payment).filter(Payment.client_id == client.id).all()

    summary_kpis = {
        "Total Revenue": f"₹{client.total_revenue:,.2f}",
        "Amount Paid": f"₹{client.paid_amount:,.2f}",
        "Outstanding": f"₹{client.outstanding_amount:,.2f}",
        "Services Count": str(client.total_services)
    }

    headers = ["Date", "Type", "Ref / Code", "Description", "Amount (₹)", "Status"]
    data_rows = []

    for inv in invoices:
        data_rows.append([
            inv.issue_date,
            "Invoice",
            inv.invoice_number,
            f"Service Invoice (Due: {inv.due_date})",
            f"₹{inv.grand_total:,.2f}",
            inv.status
        ])

    for p in payments:
        data_rows.append([
            p.payment_date,
            "Payment Received",
            p.payment_code or "PAY",
            f"Method: {p.payment_method} (Txn: {p.transaction_id or 'N/A'})",
            f"- ₹{p.amount:,.2f}",
            "Paid"
        ])

    pdf_bytes = generate_report_pdf(
        title=f"STATEMENT OF ACCOUNT — {client.company_name.upper()}",
        subtitle=f"Client Code: {client.client_code} | Contact: {client.email or 'N/A'}",
        summary_kpis=summary_kpis,
        data_rows=data_rows,
        headers=headers
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=statement_{client.client_code}.pdf"}
    )

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Invoice, InvoiceItem, Client, Service, AuditLog, CompanySetting
from app.schemas.schemas import InvoiceCreate, InvoiceResponse, CustomInvoicePDFRequest
from app.api.auth import get_current_user, User
from app.utils.pdf_generator import generate_invoice_pdf
from app.core.config import settings

router = APIRouter(prefix="/invoices", tags=["invoices"])

def get_company_profile(db: Session) -> dict:
    items = db.query(CompanySetting).all()
    company_data = {
        "name": settings.COMPANY_NAME,
        "website": settings.COMPANY_WEBSITE,
        "email": settings.COMPANY_EMAIL,
        "phone": settings.COMPANY_PHONE,
        "gstin": settings.COMPANY_GSTIN,
        "address": settings.COMPANY_ADDRESS
    }
    for item in items:
        if item.key == "company_name": company_data["name"] = item.value
        elif item.key == "company_website": company_data["website"] = item.value
        elif item.key == "company_email": company_data["email"] = item.value
        elif item.key == "company_phone": company_data["phone"] = item.value
        elif item.key == "company_gstin": company_data["gstin"] = item.value
        elif item.key == "company_address": company_data["address"] = item.value
    return company_data

def generate_next_invoice_number(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"AUR-INV-{year}-"
    last_inv = db.query(Invoice).filter(Invoice.invoice_number.like(f"{prefix}%")).order_by(Invoice.id.desc()).first()
    if not last_inv:
        return f"{prefix}0001"
    try:
        last_num = int(last_inv.invoice_number.split("-")[-1])
        next_num = last_num + 1
    except Exception:
        next_num = db.query(Invoice).count() + 1
    return f"{prefix}{next_num:04d}"

@router.get("/next-number")
def get_next_invoice_num(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"invoice_number": generate_next_invoice_number(db)}

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    res = []
    for inv in invoices:
        client = db.query(Client).filter(Client.id == inv.client_id).first()
        items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()
        
        item = InvoiceResponse.from_orm(inv)
        item.client_name = client.name if client else "N/A"
        item.client_company = client.company_name if client else "N/A"
        item.items = items
        res.append(item)
    return res

@router.post("", response_model=InvoiceResponse)
def create_invoice(inv_in: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == inv_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Selected client not found")

    invoice_number = generate_next_invoice_number(db)

    subtotal = 0.0
    items_to_create = []
    for item in inv_in.items:
        t = item.quantity * item.unit_price
        subtotal += t
        items_to_create.append(InvoiceItem(description=item.description, quantity=item.quantity, unit_price=item.unit_price, total=t))

    grand_total = subtotal - inv_in.discount_amount + inv_in.tax_amount
    balance_due = grand_total

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    status = "Pending"
    if inv_in.due_date < today_str:
        status = "Overdue"

    invoice = Invoice(
        invoice_number=invoice_number,
        client_id=inv_in.client_id,
        service_id=inv_in.service_id,
        issue_date=inv_in.issue_date or today_str,
        due_date=inv_in.due_date,
        subtotal=subtotal,
        discount_amount=inv_in.discount_amount,
        tax_amount=inv_in.tax_amount,
        grand_total=grand_total,
        amount_paid=0.0,
        balance_due=balance_due,
        status=status,
        terms=inv_in.terms,
        notes=inv_in.notes,
        created_by=current_user.full_name
    )
    db.add(invoice)
    db.flush()

    for itm in items_to_create:
        itm.invoice_id = invoice.id
        db.add(itm)

    db.commit()
    db.refresh(invoice)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_INVOICE",
        record_type="Invoice",
        record_id=str(invoice.id),
        details=f"Created invoice #{invoice.invoice_number} for client '{client.company_name}' (Total: ₹{grand_total})"
    )
    db.add(audit)
    db.commit()

    res = InvoiceResponse.from_orm(invoice)
    res.client_name = client.name
    res.client_company = client.company_name
    res.items = items_to_create
    return res

@router.post("/generate-pdf")
def generate_custom_invoice_pdf(payload: CustomInvoicePDFRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company_data = get_company_profile(db)
    
    inv_num = payload.invoice_number or generate_next_invoice_number(db)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    req_subtotal = sum(itm.quantity * itm.unit_price for itm in payload.items if (itm.item_type or "required").lower() != "spent")
    spent_subtotal = sum(itm.quantity * itm.unit_price for itm in payload.items if (itm.item_type or "").lower() == "spent")
    
    subtotal = req_subtotal if req_subtotal > 0 else (req_subtotal + spent_subtotal)
    grand_total = max(0.0, subtotal - payload.discount_amount + payload.tax_amount)

    inv_dict = {
        "invoice_number": inv_num,
        "issue_date": payload.issue_date or today_str,
        "due_date": payload.due_date or today_str,
        "status": payload.status or "Pending",
        "client_name": payload.client_name or "Valued Client",
        "client_company": payload.client_company or "Client Enterprise",
        "client_email": payload.client_email or "",
        "client_phone": payload.client_phone or "",
        "client_address": payload.client_address or "",
        "client_gstin": payload.client_gstin or "",
        "subtotal": subtotal,
        "discount_amount": payload.discount_amount,
        "tax_amount": payload.tax_amount,
        "grand_total": grand_total,
        "amount_paid": 0.0,
        "balance_due": grand_total,
        "terms": payload.terms or "Payment strictly due within 15 business days.",
        "notes": payload.notes or "",
        "signatory_title": payload.signatory_title or "Business Development Executive",
        "items": [
            {
                "description": itm.description,
                "quantity": itm.quantity,
                "unit_price": itm.unit_price,
                "total": itm.quantity * itm.unit_price,
                "item_type": itm.item_type or "required",
                "category": itm.category
            } for itm in payload.items
        ]
    }

    pdf_bytes = generate_invoice_pdf(inv_dict, company_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{inv_num}.pdf"}
    )

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == inv.client_id).first()
    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()
    
    res = InvoiceResponse.from_orm(inv)
    res.client_name = client.name if client else "N/A"
    res.client_company = client.company_name if client else "N/A"
    res.items = items
    return res

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    client = db.query(Client).filter(Client.id == inv.client_id).first()
    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()

    inv_dict = {
        "invoice_number": inv.invoice_number,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "status": inv.status,
        "client_name": client.name if client else "Client",
        "client_company": client.company_name if client else "Company",
        "client_email": client.email if client else "",
        "client_phone": client.phone if client else "",
        "client_address": client.address if client else "",
        "client_gstin": client.gstin if client else "",
        "subtotal": inv.subtotal,
        "discount_amount": inv.discount_amount,
        "tax_amount": inv.tax_amount,
        "grand_total": inv.grand_total,
        "amount_paid": inv.amount_paid,
        "balance_due": inv.balance_due,
        "terms": inv.terms,
        "notes": inv.notes,
        "signatory_title": "Business Development Executive",
        "items": [{"description": itm.description, "quantity": itm.quantity, "unit_price": itm.unit_price, "total": itm.total, "item_type": "required"} for itm in items]
    }

    company_data = get_company_profile(db)
    pdf_bytes = generate_invoice_pdf(inv_dict, company_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{inv.invoice_number}.pdf"}
    )


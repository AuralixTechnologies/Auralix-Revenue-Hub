from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import Service, Invoice, Payment, Expense, Client, ServiceCategory, ServiceTaker
from app.api.auth import get_current_user, User
from app.utils.pdf_generator import generate_report_pdf
from app.utils.export_helpers import generate_csv_export

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/monthly")
def get_monthly_report(month: str = Query("2026-08"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    services = db.query(Service).filter(Service.start_date.like(f"{month}%")).all()
    payments = db.query(Payment).filter(Payment.payment_date.like(f"{month}%")).all()
    invoices = db.query(Invoice).filter(Invoice.issue_date.like(f"{month}%")).all()
    expenses = db.query(Expense).filter(Expense.expense_date.like(f"{month}%")).all()

    tot_invoiced = sum(inv.grand_total for inv in invoices)
    tot_received = sum(p.amount for p in payments)
    tot_expenses = sum(exp.amount for exp in expenses)
    tot_outstanding = sum(inv.balance_due for inv in invoices)

    return {
        "period": month,
        "total_services": len(services),
        "total_invoices": len(invoices),
        "total_invoiced_amount": round(tot_invoiced, 2),
        "total_amount_received": round(tot_received, 2),
        "total_outstanding": round(tot_outstanding, 2),
        "total_expenses": round(tot_expenses, 2),
        "net_profit": round(tot_received - tot_expenses, 2),
        "services_summary": [
            {"id": s.id, "code": s.service_code, "name": s.name, "amount": s.final_amount, "received": s.amount_received, "status": s.payment_status}
            for s in services
        ]
    }

@router.get("/monthly/pdf")
def export_monthly_report_pdf(month: str = Query("2026-08"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report_data = get_monthly_report(month, db, current_user)
    
    summary_kpis = {
        "Invoiced Amount": f"₹{report_data['total_invoiced_amount']:,.2f}",
        "Cash Received": f"₹{report_data['total_amount_received']:,.2f}",
        "Total Expenses": f"₹{report_data['total_expenses']:,.2f}",
        "Net Profit": f"₹{report_data['net_profit']:,.2f}"
    }

    headers = ["Service Code", "Service Name", "Final Amount (₹)", "Received (₹)", "Status"]
    data_rows = [
        [s['code'], s['name'], f"₹{s['amount']:,.2f}", f"₹{s['received']:,.2f}", s['status']]
        for s in report_data['services_summary']
    ]

    pdf_bytes = generate_report_pdf(
        title=f"MONTHLY FINANCIAL REPORT — {month}",
        subtitle="Auralix Technologies Financial Performance",
        summary_kpis=summary_kpis,
        data_rows=data_rows,
        headers=headers
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Monthly_Report_{month}.pdf"}
    )

@router.get("/custom")
def get_custom_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    client_id: Optional[int] = None,
    category_id: Optional[int] = None,
    service_taker_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Service)
    if start_date:
        query = query.filter(Service.start_date >= start_date)
    if end_date:
        query = query.filter(Service.start_date <= end_date)
    if client_id:
        query = query.filter(Service.client_id == client_id)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if service_taker_id:
        query = query.filter(Service.service_taker_id == service_taker_id)
    if payment_status:
        query = query.filter(Service.payment_status == payment_status)

    services = query.all()
    rows = []
    tot_val = 0.0
    tot_rec = 0.0

    for s in services:
        client = db.query(Client).filter(Client.id == s.client_id).first()
        cat = db.query(ServiceCategory).filter(ServiceCategory.id == s.category_id).first()
        taker = db.query(ServiceTaker).filter(ServiceTaker.id == s.service_taker_id).first() if s.service_taker_id else None
        
        tot_val += s.final_amount
        tot_rec += s.amount_received

        rows.append({
            "service_code": s.service_code,
            "name": s.name,
            "client_name": client.company_name if client else "N/A",
            "category": cat.name if cat else "N/A",
            "taker": taker.name if taker else "N/A",
            "amount": s.final_amount,
            "received": s.amount_received,
            "pending": s.pending_amount,
            "status": s.payment_status,
            "date": s.start_date
        })

    return {
        "count": len(rows),
        "total_value": round(tot_val, 2),
        "total_received": round(tot_rec, 2),
        "data": rows
    }

@router.get("/custom/csv")
def export_custom_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    client_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_custom_report(start_date, end_date, client_id, category_id, db=db, current_user=current_user)
    headers = ["Service Code", "Service Name", "Client", "Category", "Service Taker", "Value (₹)", "Received (₹)", "Pending (₹)", "Status", "Date"]
    rows = [
        [r['service_code'], r['name'], r['client_name'], r['category'], r['taker'], r['amount'], r['received'], r['pending'], r['status'], r['date']]
        for r in report['data']
    ]
    csv_content = generate_csv_export(headers, rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=custom_report.csv"}
    )

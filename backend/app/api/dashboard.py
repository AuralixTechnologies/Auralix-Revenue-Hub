from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import Service, Invoice, Payment, Expense, Client, ServiceTaker, AuditLog, ServiceCategory
from app.api.auth import get_current_user, User
from app.schemas.schemas import DashboardKPIs

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpis", response_model=DashboardKPIs)
def get_dashboard_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    current_year_prefix = str(now.year)
    current_month_prefix = f"{now.year}-{now.month:02d}"

    # Cash Received Total
    total_received_payments = db.query(func.sum(Payment.amount)).scalar() or 0.0
    
    # Invoiced Total & Pending Balances
    total_invoiced = db.query(func.sum(Invoice.grand_total)).scalar() or 0.0
    total_invoiced_paid = db.query(func.sum(Invoice.amount_paid)).scalar() or 0.0
    pending_payments = db.query(func.sum(Invoice.balance_due)).filter(Invoice.status != "Cancelled").scalar() or 0.0

    # Services Amount Total
    total_service_revenue = db.query(func.sum(Service.final_amount)).scalar() or 0.0

    # Total Revenue Metric: Cash received + Invoiced payments
    total_revenue = max(total_received_payments, total_service_revenue)

    # Monthly revenue calculation (payments in current month)
    monthly_payments = db.query(func.sum(Payment.amount)).filter(Payment.payment_date.like(f"{current_month_prefix}%")).scalar() or 0.0
    monthly_services = db.query(func.sum(Service.amount_received)).filter(Service.start_date.like(f"{current_month_prefix}%")).scalar() or 0.0
    this_month_revenue = max(monthly_payments, monthly_services)

    # Yearly revenue calculation
    yearly_payments = db.query(func.sum(Payment.amount)).filter(Payment.payment_date.like(f"{current_year_prefix}%")).scalar() or 0.0
    yearly_services = db.query(func.sum(Service.amount_received)).filter(Service.start_date.like(f"{current_year_prefix}%")).scalar() or 0.0
    this_year_revenue = max(yearly_payments, yearly_services)

    # Counts
    total_clients = db.query(Client).count()
    total_services = db.query(Service).count()
    total_invoices = db.query(Invoice).count()
    completed_services = db.query(Service).filter(Service.payment_status == "Paid").count()
    
    # Expenses & Profit
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0.0
    net_profit = total_revenue - total_expenses

    return DashboardKPIs(
        total_revenue=round(total_revenue, 2),
        this_month_revenue=round(this_month_revenue, 2),
        this_year_revenue=round(this_year_revenue, 2),
        pending_payments=round(pending_payments, 2),
        total_clients=total_clients,
        total_services=total_services,
        total_invoices=total_invoices,
        completed_services=completed_services,
        total_expenses=round(total_expenses, 2),
        net_profit=round(net_profit, 2),
        cash_received=round(total_received_payments, 2)
    )

@router.get("/charts")
def get_dashboard_charts(period: str = "30days", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Revenue Over Time (Monthly trends for year 2026)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_trend = []
    
    for i in range(1, 13):
        m_str = f"2026-{i:02d}"
        rev = db.query(func.sum(Payment.amount)).filter(Payment.payment_date.like(f"{m_str}%")).scalar() or 0.0
        exp = db.query(func.sum(Expense.amount)).filter(Expense.expense_date.like(f"{m_str}%")).scalar() or 0.0
        if rev == 0.0:
            s_rev = db.query(func.sum(Service.amount_received)).filter(Service.start_date.like(f"{m_str}%")).scalar() or 0.0
            rev = s_rev
        monthly_trend.append({
            "month": months[i-1],
            "revenue": round(rev, 2),
            "expenses": round(exp, 2),
            "profit": round(rev - exp, 2)
        })

    # 2. Revenue by Service Category
    category_chart = []
    categories = db.query(ServiceCategory).all()
    for cat in categories:
        cat_rev = db.query(func.sum(Service.final_amount)).filter(Service.category_id == cat.id).scalar() or 0.0
        if cat_rev > 0:
            category_chart.append({"name": cat.name, "value": round(cat_rev, 2)})

    # 3. Revenue by Client (Top 5)
    client_chart = []
    clients = db.query(Client).order_by(Client.total_revenue.desc()).limit(5).all()
    for cl in clients:
        client_chart.append({"name": cl.company_name or cl.name, "revenue": round(cl.total_revenue, 2)})

    # 4. Revenue by Service Taker
    taker_chart = []
    takers = db.query(ServiceTaker).all()
    for tk in takers:
        tk_rev = db.query(func.sum(Service.final_amount)).filter(Service.service_taker_id == tk.id).scalar() or 0.0
        if tk_rev > 0:
            taker_chart.append({"name": tk.name, "revenue": round(tk_rev, 2)})

    # 5. Payment Status Breakdown
    status_counts = {
        "Paid": db.query(Invoice).filter(Invoice.status == "Paid").count(),
        "Partially Paid": db.query(Invoice).filter(Invoice.status == "Partially Paid").count(),
        "Pending": db.query(Invoice).filter(Invoice.status == "Pending").count(),
        "Overdue": db.query(Invoice).filter(Invoice.status == "Overdue").count()
    }

    return {
        "monthly_trend": monthly_trend,
        "revenue_by_category": category_chart,
        "revenue_by_client": client_chart,
        "revenue_by_taker": taker_chart,
        "status_breakdown": [{"name": k, "value": v} for k, v in status_counts.items()]
    }

@router.get("/recent-activities")
def get_recent_activities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()
    return [
        {
            "id": log.id,
            "user_email": log.user_email,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        }
        for log in logs
    ]

@router.get("/deadlines")
def get_upcoming_deadlines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    services = db.query(Service).filter(
        Service.payment_status != "Paid",
        Service.due_date >= today_str
    ).order_by(Service.due_date.asc()).limit(5).all()

    res = []
    for s in services:
        client = db.query(Client).filter(Client.id == s.client_id).first()
        res.append({
            "id": s.id,
            "name": s.name,
            "client_name": client.company_name if client else "N/A",
            "due_date": s.due_date,
            "amount": s.final_amount,
            "pending": s.pending_amount,
            "status": s.payment_status
        })
    return res

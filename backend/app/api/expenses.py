from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.models import Expense, ExpenseCategory, AuditLog
from app.schemas.schemas import ExpenseCreate, ExpenseResponse, ExpenseCategorySchema
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/categories", response_model=List[ExpenseCategorySchema])
def get_expense_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ExpenseCategory).all()

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expenses = db.query(Expense).order_by(Expense.created_at.desc()).all()
    res = []
    for exp in expenses:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == exp.category_id).first()
        item = ExpenseResponse.from_orm(exp)
        item.category_name = cat.name if cat else "N/A"
        res.append(item)
    return res

@router.post("", response_model=ExpenseResponse)
def create_expense(exp_in: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Expense).count() + 1
    expense_code = f"AUR-EXP-{count:04d}"

    exp = Expense(
        expense_code=expense_code,
        category_id=exp_in.category_id,
        description=exp_in.description,
        amount=exp_in.amount,
        expense_date=exp_in.expense_date or datetime.utcnow().strftime("%Y-%m-%d"),
        vendor=exp_in.vendor,
        payment_method=exp_in.payment_method,
        receipt_url=exp_in.receipt_url,
        added_by=current_user.full_name
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == exp.category_id).first()

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ADD_EXPENSE",
        record_type="Expense",
        record_id=str(exp.id),
        details=f"Added expense ₹{exp.amount} ({exp.description}) under {cat.name if cat else 'General'}"
    )
    db.add(audit)
    db.commit()

    res = ExpenseResponse.from_orm(exp)
    res.category_name = cat.name if cat else "N/A"
    return res

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully"}

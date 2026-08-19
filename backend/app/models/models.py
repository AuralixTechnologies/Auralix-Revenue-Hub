from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    permissions = Column(JSON, default=dict)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    phone = Column(String(20), nullable=True)
    status = Column(String(20), default="active")
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    role = relationship("Role", back_populates="users")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    company_name = Column(String(100), nullable=False)
    email = Column(String(100), index=True)
    phone = Column(String(20))
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    country = Column(String(50), default="India")
    gstin = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    total_services = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    outstanding_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    services = relationship("Service", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="client", cascade="all, delete-orphan")

class ServiceCategory(Base):
    __tablename__ = "service_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    active = Column(Boolean, default=True)
    
    services = relationship("Service", back_populates="category")

class ServiceTaker(Base):
    __tablename__ = "service_takers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    specialization = Column(String(100), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    services = relationship("Service", back_populates="service_taker")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    service_code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("service_categories.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    service_taker_id = Column(Integer, ForeignKey("service_takers.id"), nullable=True)
    description = Column(Text, nullable=True)
    start_date = Column(String(20), nullable=True)
    due_date = Column(String(20), nullable=True)
    completion_date = Column(String(20), nullable=True)
    amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    amount_received = Column(Float, default=0.0)
    pending_amount = Column(Float, default=0.0)
    payment_status = Column(String(30), default="Pending") # Paid, Partially Paid, Pending, Overdue
    payment_method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    client = relationship("Client", back_populates="services")
    category = relationship("ServiceCategory", back_populates="services")
    service_taker = relationship("ServiceTaker", back_populates="services")
    invoices = relationship("Invoice", back_populates="service")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. AUR-INV-2026-0001
    client_id = Column(Integer, ForeignKey("clients.id"))
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    issue_date = Column(String(20), nullable=False)
    due_date = Column(String(20), nullable=False)
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    status = Column(String(30), default="Pending") # Paid, Partially Paid, Pending, Overdue, Cancelled
    terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    client = relationship("Client", back_populates="invoices")
    service = relationship("Service", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String(255), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    invoice = relationship("Invoice", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    payment_code = Column(String(50), unique=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    amount = Column(Float, nullable=False)
    payment_date = Column(String(20), nullable=False)
    payment_method = Column(String(50), nullable=False) # Cash, UPI, Bank Transfer, Credit Card, Debit Card, Other
    transaction_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    invoice = relationship("Invoice", back_populates="payments")
    client = relationship("Client", back_populates="payments")

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    expense_code = Column(String(50), unique=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"))
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(String(20), nullable=False)
    vendor = Column(String(100), nullable=True)
    payment_method = Column(String(50), nullable=True)
    receipt_url = Column(String(255), nullable=True)
    added_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    category = relationship("ExpenseCategory")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    record_type = Column(String(50), nullable=False)
    record_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    previous_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="info") # info, success, warning, alert
    is_read = Column(Boolean, default=False)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CompanySetting(Base):
    __tablename__ = "company_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

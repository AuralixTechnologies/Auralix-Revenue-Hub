from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role_id: int
    phone: Optional[str] = None
    status: Optional[str] = "active"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    password: str   # confirm identity before changing email

# --- Client Schemas ---
class ClientBase(BaseModel):
    name: str
    company_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    gstin: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    gstin: Optional[str] = None
    notes: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    client_code: str
    total_services: int = 0
    total_revenue: float = 0.0
    paid_amount: float = 0.0
    outstanding_amount: float = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

# --- Service Category Schemas ---
class ServiceCategorySchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    active: bool = True
    class Config:
        from_attributes = True

# --- Service Taker Schemas ---
class ServiceTakerBase(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    status: Optional[str] = "active"

class ServiceTakerCreate(ServiceTakerBase):
    pass

class ServiceTakerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    status: Optional[str] = None

class ServiceTakerResponse(ServiceTakerBase):
    id: int
    created_at: datetime
    total_services: Optional[int] = 0
    total_revenue: Optional[float] = 0.0
    completed_services: Optional[int] = 0
    pending_services: Optional[int] = 0
    class Config:
        from_attributes = True

class RoleSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


# --- Service Schemas ---
class ServiceBase(BaseModel):
    name: str
    category_id: int
    client_id: int
    service_taker_id: Optional[int] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completion_date: Optional[str] = None
    amount: float = 0.0
    discount: float = 0.0
    tax_amount: float = 0.0
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ServiceCreate(ServiceBase):
    amount_received: Optional[float] = 0.0

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    client_id: Optional[int] = None
    service_taker_id: Optional[int] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completion_date: Optional[str] = None
    amount: Optional[float] = None
    discount: Optional[float] = None
    tax_amount: Optional[float] = None
    amount_received: Optional[float] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: int
    service_code: str
    final_amount: float
    amount_received: float
    pending_amount: float
    payment_status: str
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    category_name: Optional[str] = None
    service_taker_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Invoice & Invoice Item Schemas ---
class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    total: float
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: int
    service_id: Optional[int] = None
    issue_date: str
    due_date: str
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    terms: Optional[str] = "Payment due within 15 days of invoice date."
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]

class CustomInvoiceItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    item_type: Optional[str] = "required"  # "required" or "spent"
    category: Optional[str] = None

class CustomInvoicePDFRequest(BaseModel):
    invoice_number: Optional[str] = None
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = "Pending"
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    client_address: Optional[str] = None
    client_gstin: Optional[str] = None
    items: List[CustomInvoiceItem] = []
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    terms: Optional[str] = None
    notes: Optional[str] = None
    signatory_title: Optional[str] = "Business Development Executive"

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    service_id: Optional[int] = None
    issue_date: str
    due_date: str
    subtotal: float
    discount_amount: float
    tax_amount: float
    grand_total: float
    amount_paid: float
    balance_due: float
    status: str
    terms: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    created_at: datetime
    class Config:
        from_attributes = True

# --- Payment Schemas ---
class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_date: str
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    payment_code: str
    invoice_id: int
    invoice_number: Optional[str] = None
    client_id: int
    client_name: Optional[str] = None
    amount: float
    payment_date: str
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    recorded_by: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Expense Category & Expense Schemas ---
class ExpenseCategorySchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    category_id: int
    description: str
    amount: float
    expense_date: str
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    expense_code: str
    category_id: int
    category_name: Optional[str] = None
    description: str
    amount: float
    expense_date: str
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None
    added_by: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Audit & Notification & Setting Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: str
    action: str
    record_type: str
    record_id: Optional[str] = None
    details: Optional[str] = None
    previous_values: Optional[Any] = None
    new_values: Optional[Any] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class CompanySettingSchema(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

# --- Dashboard & Report Analytics ---
class DashboardKPIs(BaseModel):
    total_revenue: float
    this_month_revenue: float
    this_year_revenue: float
    pending_payments: float
    total_clients: int
    total_services: int
    total_invoices: int
    completed_services: int
    total_expenses: float
    net_profit: float
    cash_received: float

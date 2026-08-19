export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role_id: number;
  role_name: string;
  permissions?: Record<string, boolean>;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Client {
  id: number;
  client_code: string;
  name: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstin?: string;
  notes?: string;
  total_services: number;
  total_revenue: number;
  paid_amount: number;
  outstanding_amount: number;
  created_at: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export interface ServiceTaker {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status: string;
  total_services?: number;
  completed_services?: number;
  pending_services?: number;
  total_revenue?: number;
}

export interface Service {
  id: number;
  service_code: string;
  name: string;
  category_id: number;
  client_id: number;
  service_taker_id?: number;
  description?: string;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  amount: number;
  discount: number;
  tax_amount: number;
  final_amount: number;
  amount_received: number;
  pending_amount: number;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  client_name?: string;
  client_company?: string;
  category_name?: string;
  service_taker_name?: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name?: string;
  client_company?: string;
  service_id?: number;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  terms?: string;
  notes?: string;
  created_by?: string;
  items?: InvoiceItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  payment_code: string;
  invoice_id: number;
  invoice_number?: string;
  client_id: number;
  client_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Expense {
  id: number;
  expense_code: string;
  category_id: number;
  category_name?: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  payment_method?: string;
  receipt_url?: string;
  added_by?: string;
  created_at: string;
}

export interface DashboardKPIs {
  total_revenue: number;
  this_month_revenue: number;
  this_year_revenue: number;
  pending_payments: number;
  total_clients: number;
  total_services: number;
  total_invoices: number;
  completed_services: number;
  total_expenses: number;
  net_profit: number;
  cash_received: number;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  record_type: string;
  record_id?: string;
  details?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Invoice, Client, Service } from '../types';
import { formatINR, getStatusBadgeStyle } from '../utils/formatters';
import { triggerFileDownload } from '../utils/fileDownloader';
import { FileText, FileCheck, Plus, Search, Download, Eye, X, Calendar as CalendarIcon, UserPlus, AlertCircle } from 'lucide-react';

interface InvoicesProps {
  onNavigateToGenerator?: () => void;
}

export const Invoices: React.FC<InvoicesProps> = ({ onNavigateToGenerator }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Form State
  const [clientId, setClientId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [taxAmount, setTaxAmount] = useState<number | ''>(0);
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit_price: number }>>([
    { description: 'Auralix Enterprise Software Service', quantity: 1, unit_price: 25000 }
  ]);
  const [terms, setTerms] = useState('Payment strictly due within 15 days of invoice issue date.');

  // Quick Client inline state
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickCompName, setQuickCompName] = useState('');
  const [quickContactName, setQuickContactName] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [invRes, cliRes, srvRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients'),
        api.get('/services')
      ]);
      setInvoices(invRes.data);
      setClients(cliRes.data);
      setServices(srvRes.data);

      if (cliRes.data.length > 0 && !clientId) {
        setClientId(cliRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCompName || !quickContactName) return;
    try {
      const res = await api.post('/clients', {
        name: quickContactName,
        company_name: quickCompName
      });
      const newClient = res.data;
      setClients([newClient, ...clients]);
      setClientId(newClient.id);
      setShowQuickClient(false);
      setQuickCompName('');
      setQuickContactName('');
    } catch (err) {
      alert('Failed to add client');
    }
  };

  const setDueDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  // Auto-calculated totals
  const subtotal = items.reduce((acc, itm) => acc + (itm.quantity * itm.unit_price), 0);
  const discNum = Number(discountAmount) || 0;
  const taxNum = Number(taxAmount) || 0;
  const grandTotal = Math.max(0, subtotal - discNum + taxNum);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !dueDate || items.some(i => !i.description || i.unit_price <= 0)) {
      alert('Please fill out client, due date, and valid line items.');
      return;
    }

    try {
      await api.post('/invoices', {
        client_id: Number(clientId),
        service_id: serviceId ? Number(serviceId) : null,
        issue_date: issueDate,
        due_date: dueDate,
        discount_amount: discNum,
        tax_amount: taxNum,
        terms,
        items
      });
      setShowCreateModal(false);
      resetForm();
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const handleDownloadPDF = (invoiceId: number, invoiceNumber: string) => {
    api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      .then((res) => {
        triggerFileDownload(res.data, `Invoice_${invoiceNumber}.pdf`, 'application/pdf');
      })
      .catch((err) => {
        console.error('PDF download error:', err);
        alert('Failed to generate PDF invoice');
      });
  };

  const resetForm = () => {
    setServiceId('');
    setDueDate('');
    setDiscountAmount(0);
    setTaxAmount(0);
    setItems([{ description: 'Auralix Enterprise Software Service', quantity: 1, unit_price: 25000 }]);
    setShowQuickClient(false);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.client_company && inv.client_company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" /> Invoice Management System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Concurrency-safe automated billing, PDF invoice generation, and tax compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToGenerator && (
            <button
              onClick={onNavigateToGenerator}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs rounded-2xl border border-orange-500/30 transition-all"
            >
              <FileCheck className="w-4 h-4" /> Open Interactive Invoice Generator
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Quick Add Invoice
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice # (e.g. AUR-INV-2026-0001) or company..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Client Company</th>
                <th className="p-4">Issue / Due Date</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-right">Amount Paid</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">PDF & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No invoice records found. Click "Create New Tax Invoice" to bill clients.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-400">{inv.invoice_number}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{inv.client_company}</div>
                      <div className="text-[10px] text-slate-400">{inv.client_name}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{inv.issue_date}</div>
                      <div className="text-[10px] text-amber-400">Due: {inv.due_date}</div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-100">{formatINR(inv.grand_total)}</td>
                    <td className="p-4 text-right font-medium text-emerald-400">{formatINR(inv.amount_paid)}</td>
                    <td className="p-4 text-right font-medium text-amber-400">{formatINR(inv.balance_due)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyle(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-semibold transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => setPreviewInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Preview Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Create Corporate Tax Invoice
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold">Select Client Company *</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(!showQuickClient)}
                      className="text-orange-400 hover:text-orange-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> + Quick Add Client
                    </button>
                  </div>

                  {showQuickClient ? (
                    <div className="p-3 bg-slate-950 border border-orange-500/30 rounded-xl space-y-2 mb-2">
                      <span className="text-[10px] text-orange-400 font-bold uppercase block">Quick Add New Client</span>
                      <input
                        type="text"
                        placeholder="Company Name (e.g. Zenith AI)"
                        value={quickCompName}
                        onChange={(e) => setQuickCompName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Contact Person (e.g. Priya Sharma)"
                        value={quickContactName}
                        onChange={(e) => setQuickContactName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowQuickClient(false)}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddClient}
                          className="px-3 py-1 bg-orange-500 text-slate-950 font-bold rounded-lg"
                        >
                          Save & Select Client
                        </button>
                      </div>
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium"><AlertCircle className="w-4 h-4" /> No clients registered yet.</span>
                      <button
                        type="button"
                        onClick={() => setShowQuickClient(true)}
                        className="px-2.5 py-1 bg-orange-500 text-slate-950 font-bold rounded-lg text-[11px]"
                      >
                        + Add Client
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.name})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-orange-400" /> Payment Due Date *
                    </label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setDueDateOffset(7)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+7D</button>
                      <button type="button" onClick={() => setDueDateOffset(15)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+15D</button>
                      <button type="button" onClick={() => setDueDateOffset(30)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+30D</button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Invoice Itemization Section */}
              <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950 space-y-3">
                <div className="flex items-center justify-between font-semibold text-slate-300">
                  <span>Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1 font-bold"
                  >
                    + Add Item Row
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Item description..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-200"
                    />
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                      className="col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-2 text-right text-slate-200 font-bold"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="col-span-1 text-slate-500 hover:text-rose-400 text-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-center">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tax / GST (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-orange-400 font-semibold mb-1">Grand Total (₹)</label>
                  <div className="p-2 text-sm font-extrabold text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    {formatINR(grandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold shadow-lg shadow-orange-500/25"
                >
                  Generate & Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

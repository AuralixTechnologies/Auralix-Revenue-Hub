import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Payment, Invoice } from '../types';
import { formatINR } from '../utils/formatters';
import { CreditCard, Plus, Search, CheckCircle2, ArrowUpRight, X } from 'lucide-react';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [invoiceId, setInvoiceId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices')
      ]);
      setPayments(payRes.data);
      setInvoices(invRes.data.filter((i: Invoice) => i.balance_due > 0));
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = Number(amount);
    if (!invoiceId || amtNum <= 0) {
      alert('Please select an invoice and enter a valid payment amount.');
      return;
    }

    try {
      await api.post('/payments', {
        invoice_id: Number(invoiceId),
        amount: amtNum,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        notes
      });
      setShowAddModal(false);
      setInvoiceId('');
      setAmount('');
      setTransactionId('');
      setNotes('');
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record payment');
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.payment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.invoice_number && p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" /> Payment Reconciliation System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cash collection log and instant balance reconciliation across client accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Record New Payment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payment code, invoice #, or client company..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Payments Log Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Payment Code</th>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Client Company</th>
                <th className="p-4 text-right">Amount Received</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Method & Reference</th>
                <th className="p-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No payment records logged. Click "Record New Payment" to log cash receipts.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-400">{p.payment_code}</td>
                    <td className="p-4 font-mono text-orange-400">{p.invoice_number}</td>
                    <td className="p-4 font-semibold text-slate-200">{p.client_name}</td>
                    <td className="p-4 text-right font-extrabold text-emerald-400">{formatINR(p.amount)}</td>
                    <td className="p-4 text-slate-300">{p.payment_date}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{p.payment_method}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Txn: {p.transaction_id || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-slate-400">{p.recorded_by || 'Authority'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Record Client Payment
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Outstanding Invoice *</label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setInvoiceId(id);
                    const inv = invoices.find(i => i.id === id);
                    if (inv) setAmount(inv.balance_due);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                >
                  <option value="">-- Select Pending Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.invoice_number} - {inv.client_company} (Balance Due: {formatINR(inv.balance_due)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="20000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-bold focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Transaction / Reference ID</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI-9988221100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/25"
                >
                  Confirm & Reconcile Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

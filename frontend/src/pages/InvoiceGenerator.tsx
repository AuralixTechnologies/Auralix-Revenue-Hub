import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Client } from '../types';
import { formatINR } from '../utils/formatters';
import { triggerFileDownload } from '../utils/fileDownloader';
import { AuralixLogo } from '../components/common/AuralixLogo';
import {
  FileText, Download, Plus, Trash2, Calendar, Building, User,
  DollarSign, CheckCircle2, AlertCircle, FileCheck, Layers, Eye, RefreshCw, Save
} from 'lucide-react';

interface InvoiceItemRow {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: 'required' | 'spent';
  category?: string;
}

export const InvoiceGenerator: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('custom');
  
  // Client details
  const [clientName, setClientName] = useState('Priya Sharma');
  const [clientCompany, setClientCompany] = useState('Apex Technologies Private Limited');
  const [clientEmail, setClientEmail] = useState('contact@apextech.com');
  const [clientPhone, setClientPhone] = useState('+91 98401 12345');
  const [clientGstin, setClientGstin] = useState('33AAACA1234A1Z1');
  const [clientAddress, setClientAddress] = useState('Tech Park Tower B, Outer Ring Road, Bengaluru, KA');

  // Invoice metadata & Signatory
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState('Pending');
  const [signatoryTitle, setSignatoryTitle] = useState('Business Development Executive');

  // Required & Spent items
  const [items, setItems] = useState<InvoiceItemRow[]>([
    {
      id: '1',
      description: 'AI & Machine Learning System Development',
      quantity: 1,
      unit_price: 150000,
      item_type: 'required'
    },
    {
      id: '2',
      description: 'Cloud Infrastructure & API Integration',
      quantity: 1,
      unit_price: 45000,
      item_type: 'required'
    },
    {
      id: '3',
      description: 'GPU Cloud Server Hosting & Deployment Cost',
      quantity: 1,
      unit_price: 18000,
      item_type: 'spent',
      category: 'Hosting'
    }
  ]);

  // Adjustments
  const [discountAmount, setDiscountAmount] = useState<number>(5000);
  const [taxAmount, setTaxAmount] = useState<number>(35100); // 18% GST approx
  const [terms, setTerms] = useState('Payment strictly due within 15 days of invoice date. 18% GST included as applicable.');
  const [notes, setNotes] = useState('Thank you for choosing Auralix Technologies. Bank transfer & UPI details attached below.');

  const [loadingPdf, setLoadingPdf] = useState(false);
  const [savingDb, setSavingDb] = useState(false);

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await api.get('/invoices/next-number');
      if (res.data && res.data.invoice_number) {
        setInvoiceNumber(res.data.invoice_number);
      }
    } catch (err) {
      console.error('Failed to auto-count invoice number:', err);
    }
  };

  useEffect(() => {
    api.get('/clients')
      .then(res => setClients(res.data))
      .catch(err => console.error('Failed to load clients:', err));
    fetchNextInvoiceNumber();
  }, []);

  const handleSelectClient = (val: string) => {
    setSelectedClientId(val);
    if (val === 'custom') return;

    const cli = clients.find(c => c.id === Number(val));
    if (cli) {
      setClientName(cli.name);
      setClientCompany(cli.company_name);
      setClientEmail(cli.email || '');
      setClientPhone(cli.phone || '');
      setClientGstin(cli.gstin || '');
      setClientAddress(cli.address ? `${cli.address}, ${cli.city || ''}` : '');
    }
  };

  const addRequiredItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unit_price: 0,
        item_type: 'required'
      }
    ]);
  };

  const addSpentItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unit_price: 0,
        item_type: 'spent',
        category: 'Miscellaneous'
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItemRow, value: any) => {
    setItems(prev =>
      prev.map(itm => (itm.id === id ? { ...itm, [field]: value } : itm))
    );
  };

  // Auto Calculations
  const requiredItems = items.filter(i => i.item_type === 'required');
  const spentItems = items.filter(i => i.item_type === 'spent');

  const requiredTotal = requiredItems.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const spentTotal = spentItems.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  const subtotal = requiredTotal > 0 ? requiredTotal : (requiredTotal + spentTotal);
  const grandTotal = Math.max(0, subtotal - (Number(discountAmount) || 0) + (Number(taxAmount) || 0));
  const estimatedProfit = requiredTotal - spentTotal;

  // Download PDF functionality
  const handleDownloadPdf = async () => {
    if (!clientCompany || !clientName) {
      alert('Please enter client company and contact name.');
      return;
    }
    setLoadingPdf(true);
    try {
      const payload = {
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        status,
        client_name: clientName,
        client_company: clientCompany,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_address: clientAddress,
        client_gstin: clientGstin,
        discount_amount: Number(discountAmount) || 0,
        tax_amount: Number(taxAmount) || 0,
        terms,
        notes,
        signatory_title: signatoryTitle,
        items: items.map(itm => ({
          description: itm.description,
          quantity: Number(itm.quantity) || 1,
          unit_price: Number(itm.unit_price) || 0,
          item_type: itm.item_type,
          category: itm.category
        }))
      };

      const res = await api.post('/invoices/generate-pdf', payload, { responseType: 'blob' });
      triggerFileDownload(res.data, `Invoice_${invoiceNumber}.pdf`, 'application/pdf');
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF invoice. Please check all fields.');
    } finally {
      setLoadingPdf(false);
    }
  };

  // Save to DB functionality
  const handleSaveToDb = async () => {
    let targetClientId = Number(selectedClientId);
    setSavingDb(true);
    try {
      if (selectedClientId === 'custom') {
        const cliRes = await api.post('/clients', {
          name: clientName,
          company_name: clientCompany,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
          gstin: clientGstin
        });
        targetClientId = cliRes.data.id;
      }

      await api.post('/invoices', {
        client_id: targetClientId,
        issue_date: issueDate,
        due_date: dueDate,
        discount_amount: Number(discountAmount) || 0,
        tax_amount: Number(taxAmount) || 0,
        terms,
        notes,
        items: requiredItems.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      });

      alert('Invoice successfully created and registered in system database!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save invoice to database');
    } finally {
      setSavingDb(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-orange-500" /> Interactive Company Invoice & Cost Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build custom tax invoices by entering required services and spent project costs, with live PDF rendering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSaveToDb}
            disabled={savingDb}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" /> {savingDb ? 'Saving...' : 'Save to System History'}
          </button>
          
          <button
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {loadingPdf ? 'Generating PDF...' : 'Download PDF Invoice'}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT FORM CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Client & Invoice Meta Info */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <User className="w-4 h-4 text-orange-400" /> Client & Invoice Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Select Existing Client or Custom</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                >
                  <option value="custom">✏️ Custom On-the-Fly Entry</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Client Company Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Primary Contact"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">GSTIN / Tax Registration</label>
                <input
                  type="text"
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value)}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">Invoice # (Auto Counted)</label>
                  <button
                    type="button"
                    onClick={fetchNextInvoiceNumber}
                    className="text-orange-400 hover:text-orange-300 font-bold text-[10px] flex items-center gap-1"
                    title="Re-sync sequential count"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Count
                  </button>
                </div>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="AUR-INV-2026-0001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-orange-400 font-mono font-bold focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Billing Address</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="City, State, Country"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Required & Spent Items Section */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> Line Items (Required & Spent Entries)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add required services to bill the client, and spent operational costs to record expenses.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addRequiredItem}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Required Item
                </button>
                <button
                  type="button"
                  onClick={addSpentItem}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Spent Cost
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all space-y-2 ${
                    item.item_type === 'spent'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                      <select
                        value={item.item_type}
                        onChange={(e) => updateItem(item.id, 'item_type', e.target.value)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-slate-900 ${
                          item.item_type === 'spent'
                            ? 'text-rose-400 border-rose-500/40'
                            : 'text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        <option value="required">🟢 Required (Billed Item)</option>
                        <option value="spent">🔴 Spent (Operational Cost)</option>
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder={item.item_type === 'spent' ? "Spent expense description (e.g. Hosting Server)..." : "Required service/deliverable description..."}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="sm:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 focus:border-orange-500"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-center text-slate-200"
                    />
                    <input
                      type="number"
                      placeholder="Unit Rate (₹)"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))}
                      className="sm:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-2 text-right text-slate-100 font-bold focus:border-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Financial Adjustments & Terms */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <DollarSign className="w-4 h-4 text-amber-400" /> Taxes, Discounts & Notes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">GST / Tax Amount (₹)</label>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Invoice Notes / Payment Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-orange-400 font-semibold mb-1">Authorized Signatory Designation</label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  placeholder="e.g. Business Development Executive"
                  className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-orange-400 font-bold focus:border-orange-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT REAL-TIME LIVE PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Live Document Preview
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/30">
                PDF Ready
              </span>
            </div>

            {/* Paper Replica Box */}
            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-xs space-y-4 font-sans select-none">
              
              {/* Header Box */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <AuralixLogo size="sm" />
                  <p className="text-[10px] text-slate-400 mt-1">Puducherry, INDIA</p>
                  <p className="text-[10px] text-slate-500">GSTIN: 33AAAAA0000A1Z5</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-orange-500 block">TAX INVOICE</span>
                  <span className="font-mono text-slate-200 font-bold block">{invoiceNumber}</span>
                  <span className="text-[10px] text-slate-400 block">Date: {issueDate}</span>
                  <span className="text-[10px] text-amber-400 block">Due: {dueDate}</span>
                </div>
              </div>

              {/* Billed To Box */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Billed To</span>
                <p className="font-bold text-slate-100">{clientCompany || 'Client Company'}</p>
                <p className="text-slate-300 text-[11px]">{clientName || 'Contact Person'}</p>
                {clientAddress && <p className="text-slate-400 text-[10px] mt-0.5">{clientAddress}</p>}
                {clientGstin && <p className="text-slate-400 text-[10px] font-mono">GSTIN: {clientGstin}</p>}
              </div>

              {/* Line Items List */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Items & Costs</span>
                <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40 text-[11px]">
                  {items.map((i, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${i.item_type === 'spent' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className="font-medium text-slate-200 truncate block">{i.description || 'Item Description'}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 pl-3">
                          {i.quantity} x {formatINR(i.unit_price)}
                        </span>
                      </div>
                      <span className={`font-bold font-mono text-right ${i.item_type === 'spent' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {formatINR(i.quantity * i.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Financial Breakdown */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Required Services Billed:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatINR(requiredTotal)}</span>
                </div>
                {spentTotal > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Spent Operational Expenses:</span>
                    <span className="font-mono text-rose-400 font-bold">{formatINR(spentTotal)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount:</span>
                    <span className="font-mono text-rose-400">- {formatINR(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>GST / Tax:</span>
                    <span className="font-mono text-slate-300">+ {formatINR(taxAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-sm">
                  <span className="text-white">Grand Total:</span>
                  <span className="font-mono text-orange-500 text-base">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Profitability Badge */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Estimated Net Margin:</span>
                <span className={`font-bold font-mono ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(estimatedProfit)} ({requiredTotal > 0 ? Math.round((estimatedProfit / requiredTotal) * 100) : 0}%)
                </span>
              </div>

              {/* Authorized Signature Preview Box */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-slate-500 block">Digitally Verified</span>
                  <span className="text-emerald-400 font-bold">✓ Certified Invoice</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block">Authorized Signature</span>
                  <span className="text-orange-400 font-bold block text-[11px]">{signatoryTitle}</span>
                  <span className="text-slate-500 text-[9px]">Auralix Technologies</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={loadingPdf}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download Official PDF Invoice
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Service, ServiceCategory, Client, ServiceTaker } from '../types';
import { formatINR, getStatusBadgeStyle } from '../utils/formatters';
import { Plus, Search, Filter, Briefcase, Trash2, X, Calendar as CalendarIcon, UserPlus, AlertCircle } from 'lucide-react';

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<ServiceTaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [serviceTakerId, setServiceTakerId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [taxAmount, setTaxAmount] = useState<number | ''>(0);
  const [amountReceived, setAmountReceived] = useState<number | ''>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Quick Client inline form
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickCompName, setQuickCompName] = useState('');
  const [quickContactName, setQuickContactName] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes, cliRes, teamRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/categories'),
        api.get('/clients'),
        api.get('/team'),
      ]);
      setServices(srvRes.data);
      setCategories(catRes.data);
      setClients(cliRes.data);
      setTeam(teamRes.data);

      if (cliRes.data.length > 0 && !clientId) {
        setClientId(cliRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
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

  // Form Auto-calculations
  const amtNum = Number(amount) || 0;
  const discNum = Number(discount) || 0;
  const taxNum = Number(taxAmount) || 0;
  const finalCalculated = Math.max(0, amtNum - discNum + taxNum);
  const receivedNum = Number(amountReceived) || 0;

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !clientId || amtNum <= 0) {
      alert('Please fill out service name, category, client, and valid amount.');
      return;
    }

    try {
      await api.post('/services', {
        name,
        category_id: Number(categoryId),
        client_id: Number(clientId),
        service_taker_id: serviceTakerId ? Number(serviceTakerId) : null,
        description,
        amount: amtNum,
        discount: discNum,
        tax_amount: taxNum,
        amount_received: receivedNum,
        start_date: startDate,
        due_date: dueDate || null
      });
      setShowAddModal(false);
      resetForm();
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create service');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service record?')) {
      try {
        await api.delete(`/services/${id}`);
        fetchServices();
      } catch (err) {
        alert('Failed to delete service');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setServiceTakerId('');
    setDescription('');
    setAmount('');
    setDiscount(0);
    setTaxAmount(0);
    setAmountReceived(0);
    setDueDate('');
    setShowQuickClient(false);
  };

  const filteredServices = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.service_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.client_company && s.client_company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || s.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-orange-500" /> Service Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track client service deliverables, assigned team members, and financial balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Service
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service name, code, or client company..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Service Code / Name</th>
                <th className="p-4">Client Company</th>
                <th className="p-4">Category</th>
                <th className="p-4">Service Taker</th>
                <th className="p-4 text-right">Final Amount</th>
                <th className="p-4 text-right">Received</th>
                <th className="p-4 text-right">Pending</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No service records found. Click "Add New Service" to record business services.
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{srv.name}</div>
                      <div className="text-[10px] text-orange-400 font-mono">{srv.service_code}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{srv.client_company}</div>
                      <div className="text-[10px] text-slate-400">{srv.client_name}</div>
                    </td>
                    <td className="p-4 text-slate-300">{srv.category_name}</td>
                    <td className="p-4 text-slate-300">{srv.service_taker_name || 'Unassigned'}</td>
                    <td className="p-4 text-right font-bold text-slate-100">{formatINR(srv.final_amount)}</td>
                    <td className="p-4 text-right font-medium text-emerald-400">{formatINR(srv.amount_received)}</td>
                    <td className="p-4 text-right font-medium text-amber-400">{formatINR(srv.pending_amount)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyle(srv.payment_status)}`}>
                        {srv.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" /> Add Business Service Entry
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AI Chatbot Development"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold">Client Company *</label>
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
                        placeholder="Company Name (e.g. NovaByte)"
                        value={quickCompName}
                        onChange={(e) => setQuickCompName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Contact Person (e.g. Vikram Sethi)"
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
                  <label className="block text-slate-400 font-semibold mb-1">Service Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Service Taker</label>
                  <select
                    value={serviceTakerId}
                    onChange={(e) => setServiceTakerId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Auto-calculation Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="25000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-slate-100 font-bold focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-slate-100 font-bold focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tax / GST (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-slate-100 font-bold focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-orange-400 font-semibold mb-1">Grand Final (₹)</label>
                  <div className="p-2 text-sm font-extrabold text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    {formatINR(finalCalculated)}
                  </div>
                </div>
              </div>

              {/* DATE PICKERS WITH CALENDAR PRESETS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-orange-400" /> Service Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-orange-400" /> Completion Due Date
                    </label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setDueDateOffset(7)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+7D</button>
                      <button type="button" onClick={() => setDueDateOffset(15)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+15D</button>
                      <button type="button" onClick={() => setDueDateOffset(30)} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] hover:text-orange-400">+30D</button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter project deliverables summary..."
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
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold shadow-lg shadow-orange-500/25"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

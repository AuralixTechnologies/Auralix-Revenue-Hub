import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardKPIs } from '../types';
import { formatINR } from '../utils/formatters';
import {
  TrendingUp, Calendar, AlertTriangle, Users, Briefcase, FileText,
  CheckCircle2, DollarSign, ArrowUpRight, Plus, RefreshCw, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, chartRes, actRes, deadRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-activities'),
        api.get('/dashboard/deadlines'),
      ]);
      setKpis(kpiRes.data);
      setChartData(chartRes.data.monthly_trend || []);
      setActivities(actRes.data || []);
      setDeadlines(deadRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !kpis) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-orange-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-semibold">Synchronizing Auralix RevenueHub Command Center...</p>
        </div>
      </div>
    );
  }

  const kpiList = [
    { title: 'Total Recognized Revenue', value: formatINR(kpis?.total_revenue), subtitle: 'Cash + Recognized', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { title: 'This Month Revenue', value: formatINR(kpis?.this_month_revenue), subtitle: 'Current Billing Cycle', icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Pending Receivables', value: formatINR(kpis?.pending_payments), subtitle: 'Outstanding Balances', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Net Financial Profit', value: formatINR(kpis?.net_profit), subtitle: `Revenue - Expenses (${formatINR(kpis?.total_expenses)})`, icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { title: 'Total Clients', value: kpis?.total_clients || 0, subtitle: 'Active Business Accounts', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Total Services', value: kpis?.total_services || 0, subtitle: 'Active Projects', icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Invoices Generated', value: kpis?.total_invoices || 0, subtitle: 'Total Tax Invoices', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'Completed Services', value: kpis?.completed_services || 0, subtitle: '100% Fully Paid', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Auralix Technologies <span className="text-orange-500">Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial performance, client revenue pipeline, and automated billing metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
          <button
            onClick={() => onNavigate('invoices')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" /> Create Invoice
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Record Payment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.bg} border`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{kpi.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" /> Revenue vs Expenses Trend (2026)
              </h2>
              <p className="text-xs text-slate-400">Monthly financial performance breakdown</p>
            </div>
            <button
              onClick={() => onNavigate('revenue')}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              Full Revenue Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-400" /> Service & Invoice Deadlines
            </h2>
            <p className="text-xs text-slate-400 mb-4">Pending collections approaching due date</p>

            <div className="space-y-3 overflow-y-auto max-h-56">
              {deadlines.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No upcoming deadlines found.</div>
              ) : (
                deadlines.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.client_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-orange-400">{formatINR(item.pending)}</div>
                      <div className="text-[10px] text-amber-400 font-medium">Due: {item.due_date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('invoices')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors text-center"
          >
            Manage Pending Invoices
          </button>
        </div>
      </div>

      {/* Audit Log / Recent Activity */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recent Authority Activity Log
          </h2>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            View Full Audit Trail →
          </button>
        </div>

        <div className="space-y-2">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-slate-300">{act.user_email}</span>
                <span className="text-slate-400">{act.details}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

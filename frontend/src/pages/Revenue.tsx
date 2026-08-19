import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { TrendingUp, PieChart as PieIcon, BarChart2, Filter, DollarSign, ArrowUpRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const Revenue: React.FC = () => {
  const [period, setPeriod] = useState('30days');
  const [charts, setCharts] = useState<any>({
    monthly_trend: [],
    revenue_by_category: [],
    revenue_by_client: [],
    revenue_by_taker: [],
    status_breakdown: []
  });
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/charts?period=${period}`);
      setCharts(res.data);
    } catch (err) {
      console.error('Failed to load revenue analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const COLORS = ['#F97316', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B'];

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" /> Revenue & Business Breakdown
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Service-wise, client-wise, and team performance revenue distribution.
          </p>
        </div>

        {/* Time Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          {['7days', '30days', '3months', '6months', '1year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-orange-400" /> Annual Revenue vs Profit Growth
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.monthly_trend}>
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
              />
              <Bar dataKey="revenue" fill="#F97316" radius={[6, 6, 0, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="#10B981" radius={[6, 6, 0, 0]} name="Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2x2 Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue by Service Category */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" /> Revenue by Service Category
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            {charts.revenue_by_category.length === 0 ? (
              <p className="text-xs text-slate-500">No category revenue data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.revenue_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {charts.revenue_by_category.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Top Clients by Revenue */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Top Clients by Revenue Contribution
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts.revenue_by_client}>
                <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Client Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Revenue by Service Taker / Team Member */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Revenue Generated by Service Takers
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenue_by_taker}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Taker Revenue']}
                />
                <Bar dataKey="revenue" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Payment Status Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" /> Invoice Payment Status Distribution
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.status_breakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#10B981" /> {/* Paid */}
                  <Cell fill="#F59E0B" /> {/* Partially Paid */}
                  <Cell fill="#3B82F6" /> {/* Pending */}
                  <Cell fill="#EF4444" /> {/* Overdue */}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

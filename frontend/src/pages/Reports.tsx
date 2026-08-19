import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { triggerFileDownload } from '../utils/fileDownloader';
import { FileBarChart, Download, FileSpreadsheet, Printer, Filter, Calendar, CheckCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Custom Report Builder state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [customReport, setCustomReport] = useState<any>(null);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?month=${selectedMonth}`);
      setMonthlyData(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth]);

  const handleGenerateCustomReport = async () => {
    try {
      let url = `/reports/custom?`;
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}&`;
      if (paymentStatus) url += `payment_status=${paymentStatus}&`;

      const res = await api.get(url);
      setCustomReport(res.data);
    } catch (err) {
      alert('Failed to generate custom report');
    }
  };

  const handleDownloadMonthlyPDF = () => {
    api.get(`/reports/monthly/pdf?month=${selectedMonth}`, { responseType: 'blob' })
      .then((res) => {
        triggerFileDownload(res.data, `Auralix_Monthly_Report_${selectedMonth}.pdf`, 'application/pdf');
      })
      .catch((err) => {
        console.error('PDF report download error:', err);
        alert('Failed to download PDF report');
      });
  };

  const handleExportCSV = () => {
    api.get(`/reports/custom/csv`, { responseType: 'blob' })
      .then((res) => {
        triggerFileDownload(res.data, `Auralix_Custom_Report.csv`, 'text/csv');
      })
      .catch((err) => {
        console.error('CSV export error:', err);
        alert('Failed to export CSV report');
      });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-orange-500" /> Financial Reports & Custom Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate monthly financial audits, custom filtered reports, and PDF/CSV exports.
          </p>
        </div>
      </div>

      {/* Monthly Financial Audit Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" /> Monthly Financial Audit Report
            </h2>
            <p className="text-xs text-slate-400">Select billing period for executive summary</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleDownloadMonthlyPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF Report
            </button>
          </div>
        </div>

        {monthlyData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Invoiced</span>
              <span className="text-lg font-extrabold text-slate-100">{formatINR(monthlyData.total_invoiced_amount)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cash Received</span>
              <span className="text-lg font-extrabold text-emerald-400">{formatINR(monthlyData.total_amount_received)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Expenses</span>
              <span className="text-lg font-extrabold text-rose-400">{formatINR(monthlyData.total_expenses)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Profit</span>
              <span className="text-lg font-extrabold text-orange-400">{formatINR(monthlyData.net_profit)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Report Builder Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" /> Custom Report Builder & Filter Engine
            </h2>
            <p className="text-xs text-slate-400">Filter business records by custom criteria</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Report
            </button>
          </div>
        </div>

        {/* Filters Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateCustomReport}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Run Filter & Generate Report
        </button>

        {customReport && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-200">Filtered Records Found: {customReport.count}</span>
              <span className="font-extrabold text-orange-400">Total Value: {formatINR(customReport.total_value)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Service</th>
                    <th className="p-2">Client</th>
                    <th className="p-2 text-right">Value</th>
                    <th className="p-2 text-right">Received</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customReport.data.map((r: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono text-orange-400">{r.service_code}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">{r.client_name}</td>
                      <td className="p-2 text-right font-bold">{formatINR(r.amount)}</td>
                      <td className="p-2 text-right text-emerald-400">{formatINR(r.received)}</td>
                      <td className="p-2 text-center">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

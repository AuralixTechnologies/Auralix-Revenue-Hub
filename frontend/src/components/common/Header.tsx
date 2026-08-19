import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Sun, Moon, Laptop, LogOut, Clock, ShieldCheck, FileText, Briefcase, Users, UserCheck, LayoutDashboard, TrendingUp, CreditCard, DollarSign, FileBarChart, Settings as SettingsIcon, Shield, X, ArrowRight, UserCircle } from 'lucide-react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
  onOpenNotifications?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'page' | 'client' | 'invoice' | 'service' | 'team';
  tab: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenNotifications }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Cached data for global search
  const [allData, setAllData] = useState<{
    clients: any[];
    services: any[];
    invoices: any[];
    team: any[];
  }>({ clients: [], services: [], invoices: [], team: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const pages = [
    { title: 'Command Center Dashboard', subtitle: 'Main overview & KPI cards', tab: 'dashboard' },
    { title: 'Revenue Analytics', subtitle: 'Revenue breakdowns & time filters', tab: 'revenue' },
    { title: 'Service Management', subtitle: 'Services, categories & pricing', tab: 'services' },
    { title: 'Clients Directory', subtitle: 'Client companies & PDF statements', tab: 'clients' },
    { title: 'Team & Authority Members', subtitle: 'Service takers performance matrix', tab: 'team' },
    { title: 'Invoices & Billing', subtitle: 'Tax invoices & PDF download', tab: 'invoices' },
    { title: 'Payment Receipts', subtitle: 'Reconcile payments & transactions', tab: 'payments' },
    { title: 'Expense Tracker', subtitle: 'Log business & vendor costs', tab: 'expenses' },
    { title: 'Reports & Audits', subtitle: 'Monthly PDF report & CSV exporter', tab: 'reports' },
    { title: 'System Settings', subtitle: 'Company profile & database reset', tab: 'settings' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      setTimeStr(now.toLocaleString('en-IN', options) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => {});
  }, []);

  // Fetch search data on focus/search
  const loadSearchData = async () => {
    try {
      const [cliRes, srvRes, invRes, teamRes] = await Promise.all([
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/services').catch(() => ({ data: [] })),
        api.get('/invoices').catch(() => ({ data: [] })),
        api.get('/team').catch(() => ({ data: [] })),
      ]);
      setAllData({
        clients: cliRes.data || [],
        services: srvRes.data || [],
        invoices: invRes.data || [],
        team: teamRes.data || [],
      });
    } catch (err) {
      console.error('Failed to load search data:', err);
    }
  };

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // 1. Search System Pages
    pages.forEach(p => {
      if (p.title.toLowerCase().includes(term) || p.subtitle.toLowerCase().includes(term)) {
        results.push({ id: `page-${p.tab}`, title: p.title, subtitle: p.subtitle, type: 'page', tab: p.tab });
      }
    });

    // 2. Search Clients
    allData.clients.forEach(c => {
      if (c.company_name?.toLowerCase().includes(term) || c.name?.toLowerCase().includes(term) || c.client_code?.toLowerCase().includes(term)) {
        results.push({
          id: `cli-${c.id}`,
          title: c.company_name || c.name,
          subtitle: `Client • ${c.name} (${c.client_code || 'Client'})`,
          type: 'client',
          tab: 'clients'
        });
      }
    });

    // 3. Search Invoices
    allData.invoices.forEach(i => {
      if (i.invoice_number?.toLowerCase().includes(term) || i.client_company?.toLowerCase().includes(term)) {
        results.push({
          id: `inv-${i.id}`,
          title: i.invoice_number,
          subtitle: `Invoice • ${i.client_company} (₹${i.grand_total})`,
          type: 'invoice',
          tab: 'invoices'
        });
      }
    });

    // 4. Search Services
    allData.services.forEach(s => {
      if (s.name?.toLowerCase().includes(term) || s.service_code?.toLowerCase().includes(term) || s.client_company?.toLowerCase().includes(term)) {
        results.push({
          id: `srv-${s.id}`,
          title: s.name,
          subtitle: `Service • ${s.client_company || s.service_code}`,
          type: 'service',
          tab: 'services'
        });
      }
    });

    // 5. Search Team Members
    allData.team.forEach(t => {
      if (t.name?.toLowerCase().includes(term) || t.role?.toLowerCase().includes(term) || t.email?.toLowerCase().includes(term)) {
        results.push({
          id: `team-${t.id}`,
          title: t.name,
          subtitle: `Team Authority • ${t.role}`,
          type: 'team',
          tab: 'team'
        });
      }
    });

    setSearchResults(results.slice(0, 8));
    setShowSearchResults(true);
  }, [searchTerm, allData]);

  // Click outside listener for search container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchTerm('');
    if (onNavigate) {
      onNavigate(result.tab);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeBadge = (type: SearchResult['type']) => {
    switch (type) {
      case 'page': return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">MODULE</span>;
      case 'client': return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">CLIENT</span>;
      case 'invoice': return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">INVOICE</span>;
      case 'service': return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">SERVICE</span>;
      case 'team': return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AUTHORITY</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between">
      {/* Search Input & Live Dropdown */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => {
              loadSearchData();
              if (searchTerm.trim().length > 0) setShowSearchResults(true);
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Global search clients, invoices, services, team, reports..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setShowSearchResults(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-slate-900 rounded-2xl p-2 border border-slate-700 shadow-2xl shadow-black/60 z-[9999] animate-in fade-in slide-in-from-top-2 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching records or pages found for "{searchTerm}".
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Real-time Search Results ({searchResults.length})
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelectResult(res)}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-orange-400 transition-colors">
                          {res.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{res.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(res.type)}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 transform group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live IST Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'system' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="System Theme"
          >
            <Laptop className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-orange-400 hover:border-orange-500/30 transition-all"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-xs flex items-center justify-center">
              {user?.full_name.charAt(0) || 'A'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">{user?.full_name}</span>
              <span className="text-[10px] text-orange-400 font-medium">{user?.role_name}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-2xl p-2 border border-slate-700 shadow-2xl shadow-black/60 z-[9999] animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-200">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <ShieldCheck className="w-3 h-3" /> Authorized Authority
                </span>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); if (onNavigate) onNavigate('profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors"
              >
                <UserCircle className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

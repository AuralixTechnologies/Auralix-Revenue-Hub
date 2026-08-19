import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Revenue } from './pages/Revenue';
import { Services } from './pages/Services';
import { Clients } from './pages/Clients';
import { Team } from './pages/Team';
import { Invoices } from './pages/Invoices';
import { InvoiceGenerator } from './pages/InvoiceGenerator';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { NotificationsPage } from './pages/NotificationsPage';
import { Settings } from './pages/Settings';
import { MyProfile } from './pages/MyProfile';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'revenue':
        return <Revenue />;
      case 'services':
        return <Services />;
      case 'clients':
        return <Clients />;
      case 'team':
        return <Team />;
      case 'invoices':
        return <Invoices onNavigateToGenerator={() => setActiveTab('generator')} />;
      case 'generator':
        return <InvoiceGenerator />;
      case 'payments':
        return <Payments />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'audit':
        return <AuditLogs />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <MyProfile />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenNotifications={() => setActiveTab('notifications')}
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

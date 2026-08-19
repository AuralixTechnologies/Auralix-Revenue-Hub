import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceTaker } from '../types';
import { triggerFileDownload } from '../utils/fileDownloader';
import {
  Settings as SettingsIcon, Download, Building, Database, Edit3, Trash2,
  Users, UserCheck, Shield, Plus, X, AlertTriangle, Check, Save, Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<any>({
    company_name: 'Auralix Technologies',
    company_website: 'https://auralixtechnologies.netlify.app/',
    company_email: 'auralix.org@gmail.com',
    company_phone: '+91 9342131369',
    company_gstin: '33AAAAA0000A1Z5',
    company_address: 'Puducherry, INDIA',
    currency_symbol: '₹',
    currency_code: 'INR'
  });

  const [teamMembers, setTeamMembers] = useState<ServiceTaker[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Member Modal state
  const [editingMember, setEditingMember] = useState<ServiceTaker | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberSpec, setMemberSpec] = useState('');
  const [memberStatus, setMemberStatus] = useState('active');

  // Role Modals state
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  // Brand Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftInfo, setDraftInfo] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditProfile = () => {
    setDraftInfo({ ...companyInfo });
    setEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setDraftInfo(null);
    setEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/settings/company', draftInfo);
      setCompanyInfo({ ...draftInfo });
      setEditingProfile(false);
      setDraftInfo(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save company profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Clear data confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const [compRes, teamRes, roleRes] = await Promise.all([
        api.get('/settings/company'),
        api.get('/team'),
        api.get('/team/roles')
      ]);
      setCompanyInfo(compRes.data);
      setTeamMembers(teamRes.data);
      setRoles(roleRes.data);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleExportBackup = () => {
    api.get('/settings/backup', { responseType: 'blob' })
      .then(res => {
        triggerFileDownload(res.data, 'Auralix_RevenueHub_Database_Backup.json', 'application/json');
      })
      .catch(() => alert('Failed to export database backup'));
  };

  const handleClearSampleData = async () => {
    setClearing(true);
    try {
      await api.post('/settings/reset-data');
      alert('All sample financial and client data cleared successfully!');
      setShowClearModal(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to clear sample data');
    } finally {
      setClearing(false);
    }
  };

  // Open Edit Member Modal
  const openEditMember = (member: ServiceTaker) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberRole(member.role);
    setMemberEmail(member.email || '');
    setMemberPhone(member.phone || '');
    setMemberSpec(member.specialization || '');
    setMemberStatus(member.status || 'active');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await api.put(`/team/${editingMember.id}`, {
        name: memberName,
        role: memberRole,
        email: memberEmail,
        phone: memberPhone,
        specialization: memberSpec,
        status: memberStatus
      });
      setEditingMember(null);
      fetchSettingsData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update team member');
    }
  };

  const handleDeleteMember = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete team member '${name}'?`)) {
      try {
        await api.delete(`/team/${id}`);
        fetchSettingsData();
      } catch (err) {
        alert('Failed to delete team member');
      }
    }
  };

  // Create Role Handler
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    try {
      await api.post('/team/roles', {
        name: newRoleName,
        description: newRoleDesc
      });
      setShowAddRole(false);
      setNewRoleName('');
      setNewRoleDesc('');
      fetchSettingsData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create role');
    }
  };

  // Open Edit Role Modal
  const openEditRole = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      await api.put(`/team/roles/${editingRole.id}`, {
        name: roleName,
        description: roleDesc
      });
      setEditingRole(null);
      fetchSettingsData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  // Delete Role Handler
  const handleDeleteRole = async (roleId: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete authority role '${name}'?`)) {
      try {
        await api.delete(`/team/roles/${roleId}`);
        fetchSettingsData();
      } catch (err) {
        alert('Failed to delete role');
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-orange-500" /> Company Settings, Team & Authority Roles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Edit company profile, team member details, authority roles governance, and database reset controls.
          </p>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl transition-all"
        >
          <Trash2 className="w-4 h-4" /> Clear All Sample Data
        </button>
      </div>

      {/* Grid: Company Profile & Data Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info Box */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-400" /> Auralix Technologies Brand Profile
            </h2>
            {!editingProfile ? (
              <button
                onClick={openEditProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs rounded-xl transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  form="brand-profile-form"
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <form id="brand-profile-form" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Company Name */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Name</label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={draftInfo.company_name}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_name: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold">
                    {companyInfo.company_name}
                  </div>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Official Website</label>
                {editingProfile ? (
                  <input
                    type="url"
                    value={draftInfo.company_website}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_website: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-orange-400 font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-orange-400 font-mono">
                    {companyInfo.company_website}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Email</label>
                {editingProfile ? (
                  <input
                    type="email"
                    value={draftInfo.company_email}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_email: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    {companyInfo.company_email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={draftInfo.company_phone}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    {companyInfo.company_phone}
                  </div>
                )}
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">GSTIN Tax ID</label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={draftInfo.company_gstin}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_gstin: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono">
                    {companyInfo.company_gstin}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Primary Currency</label>
                {editingProfile ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftInfo.currency_symbol}
                      onChange={(e) => setDraftInfo({ ...draftInfo, currency_symbol: e.target.value })}
                      placeholder="Symbol"
                      className="w-20 bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-emerald-400 font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-center transition-all"
                    />
                    <input
                      type="text"
                      value={draftInfo.currency_code}
                      onChange={(e) => setDraftInfo({ ...draftInfo, currency_code: e.target.value })}
                      placeholder="Code (e.g. INR)"
                      className="flex-1 bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                    {companyInfo.currency_code} ({companyInfo.currency_symbol}) - Indian Rupee
                  </div>
                )}
              </div>

              {/* Address — full width */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Business Address</label>
                {editingProfile ? (
                  <textarea
                    rows={2}
                    value={draftInfo.company_address}
                    onChange={(e) => setDraftInfo({ ...draftInfo, company_address: e.target.value })}
                    className="w-full bg-slate-950 border border-orange-500/50 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none transition-all"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                    {companyInfo.company_address}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Database Backup Box */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-400" /> Database Backup & Snapshot
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Export encrypted JSON business snapshot including client records, services, invoices, and payments.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Backup Database Now
          </button>
        </div>
      </div>

      {/* AUTHORITY ROLES & GOVERNANCE EDIT/DELETE SECTION */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Authority Roles & Governance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage, modify, or delete authority roles when team members join or exit.</p>
          </div>

          <button
            onClick={() => setShowAddRole(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Authority Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  {r.name}
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                    ACTIVE ROLE
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">{r.description || 'System authority role'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditRole(r)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  title="Modify Role"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRole(r.id, r.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Role (exited member)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TEAM MEMBERS EDIT SECTION */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-400" /> Team Members Management & Editing
          </h2>
          <span className="text-xs text-slate-400">{teamMembers.length} Active Team Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Member Name</th>
                <th className="p-3">Role / Designation</th>
                <th className="p-3">Specialization</th>
                <th className="p-3">Contact</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-bold text-white">{m.name}</td>
                  <td className="p-3 text-orange-400 font-medium">{m.role}</td>
                  <td className="p-3 text-slate-400">{m.specialization || 'General'}</td>
                  <td className="p-3 text-slate-400">{m.email || m.phone || 'N/A'}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${m.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                      {m.status || 'active'}
                    </span>
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                      title="Edit Team Member Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Exited Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ROLE MODAL */}
      {showAddRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> Add New Authority Role
              </h2>
              <button onClick={() => setShowAddRole(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Co-Founder / Vice President"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Governance Description</label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe editorial permissions and responsibilities..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg"
                >
                  Save Authority Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" /> Edit Team Member Profile
              </h2>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role / Title *</label>
                <input
                  type="text"
                  required
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Specialization</label>
                <input
                  type="text"
                  value={memberSpec}
                  onChange={(e) => setMemberSpec(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <select
                  value={memberStatus}
                  onChange={(e) => setMemberStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold shadow-lg shadow-orange-500/25"
                >
                  Save Member Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> Edit System Role Definition
              </h2>
              <button onClick={() => setEditingRole(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR SAMPLE DATA CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-slate-800 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold text-white">Clear All Sample Data?</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              This action will permanently delete all sample clients, services, invoices, payments, and expenses from the database.
              The system will be completely reset and ready for real production business entry.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearSampleData}
                disabled={clearing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/25"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear All Sample Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

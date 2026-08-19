import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" /> System Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts for invoice deadlines, payment receipts, and billing updates.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No active notifications.</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                note.is_read
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/80 border-orange-500/30 shadow-lg shadow-orange-500/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{note.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{note.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                  </span>
                </div>
              </div>

              {!note.is_read && (
                <button
                  onClick={() => handleMarkRead(note.id)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

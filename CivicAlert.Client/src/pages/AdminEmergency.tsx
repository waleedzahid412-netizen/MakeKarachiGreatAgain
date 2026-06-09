import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { ReportSummary } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  ArrowUpRight, 
  MapPin, 
  User, 
  Clock, 
  Loader 
} from 'lucide-react';

interface StatsData {
  totalReports: number;
  reportedCount: number;
  verifiedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  rejectedCount: number;
  totalToday: number;
  emergencyCount: number;
  escalatedCount: number;
  activeEmergenciesCount: number;
}

const AdminEmergency: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsRes, statsRes] = await Promise.all([
        axiosInstance.get<ReportSummary[]>('/admin/reports'),
        axiosInstance.get<StatsData>('/admin/dashboard')
      ]);

      // Only keep emergency reports, sorted by newest first
      const emergencyOnly = reportsRes.data
        .filter((r) => r.isEmergency)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setReports(emergencyOnly);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('Failed to load emergency data:', err);
      setError(err.response?.data?.error || 'Failed to retrieve active emergency reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAcknowledge = async (reportId: number) => {
    setActionLoading(true);
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/status`, {
        status: 'Verified',
        note: 'Emergency Acknowledged'
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to acknowledge emergency:', err);
      alert(err.response?.data?.error || 'Failed to acknowledge emergency.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (reportId: number) => {
    setActionLoading(true);
    try {
      await axiosInstance.post(`/admin/reports/${reportId}/escalate`);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to escalate report:', err);
      alert(err.response?.data?.error || 'Failed to escalate emergency.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (reportId: number) => {
    setActionLoading(true);
    try {
      const rep = reports.find(r => r.id === reportId);
      if (rep && rep.statusName !== 'InProgress' && rep.statusName !== 'Escalated') {
        await axiosInstance.put(`/admin/reports/${reportId}/status`, {
          status: 'InProgress',
          note: 'Work started on emergency report'
        });
      }
      
      await axiosInstance.put(`/admin/reports/${reportId}/status`, {
        status: 'Resolved',
        note: 'Emergency resolved successfully'
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to resolve emergency:', err);
      alert(err.response?.data?.error || 'Failed to resolve emergency.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[75vh] bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Loading Emergency Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto p-4 sm:p-0 font-sans text-slate-300 bg-[#0a0f1a]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
          <span>Emergency Control Center</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          High-priority administrative console for emergency management.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Stats at top */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-red-500 shadow-md">
            <div>
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider block">Active Emergencies</span>
              <span className="text-3xl font-semibold text-white block">{stats.activeEmergenciesCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-red-500/80">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-amber-500 shadow-md">
            <div>
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">Avg Response Time</span>
              <span className="text-3xl font-semibold text-white">1.8 <span className="text-xs text-slate-500 font-semibold">hrs</span></span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-amber-400/80">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500 shadow-md">
            <div>
              <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider block">Escalated Count</span>
              <span className="text-3xl font-semibold text-white">{stats.escalatedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-rose-500/80">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-white font-medium text-sm">Active Alerts Feed ({reports.length})</h3>

        {reports.length === 0 ? (
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500 text-xs italic">
            No active emergency reports found in this scope.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const isActiveAlert = r.statusName !== 'Resolved' && r.statusName !== 'Rejected';
              return (
                <div 
                  key={r.id} 
                  className={`bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 ${
                    r.statusName === 'Escalated' ? 'border-l-rose-500' : 'border-l-red-500'
                  } shadow-lg relative overflow-hidden`}
                >
                  {/* Pulsing indicator */}
                  {isActiveAlert && (
                    <div className="absolute top-4 right-4 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-405 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-555"></span>
                    </div>
                  )}

                  {/* Body details */}
                  <div className="space-y-3 flex-grow max-w-2xl">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Report #{r.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase ${
                          r.statusName === 'Escalated' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {r.statusName}
                        </span>
                      </div>
                      <h2 className="text-white font-semibold text-base tracking-tight leading-snug">{r.title}</h2>
                    </div>

                    {/* Metadata items */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-450">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-450" />
                        <span>{r.categoryName} · Karachi</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-550" />
                        <span>By {r.reporterName || 'Citizen'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-550" />
                        <span className="text-red-400 font-semibold">{formatTimeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  {isActiveAlert && (
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                      {r.statusName === 'Reported' && (
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          disabled={actionLoading}
                          className="bg-[#0a0f1a] hover:bg-[#1a2332] border border-slate-700/50 text-white text-[11px] font-semibold px-3 py-2 rounded-xl transition active:scale-95"
                        >
                          Acknowledge
                        </button>
                      )}

                      {r.statusName !== 'Escalated' && (
                        <button
                          onClick={() => handleEscalate(r.id)}
                          disabled={actionLoading}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold px-3.5 py-2 rounded-xl transition active:scale-95 shadow shadow-rose-950/20 animate-pulse"
                        >
                          Escalate
                        </button>
                      )}

                      <button
                        onClick={() => handleResolve(r.id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3.5 py-2 rounded-xl transition active:scale-95 shadow shadow-emerald-950/20"
                      >
                        Resolve Emergency
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmergency;

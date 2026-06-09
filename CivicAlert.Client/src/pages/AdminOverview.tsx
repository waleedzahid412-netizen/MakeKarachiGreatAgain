import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { LookupItem } from '../types';
import {
  BarChart2,
  AlertCircle,
  CheckCircle,
  Wrench,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
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

interface ActivityItem {
  id: number;
  reportId: number;
  reportTitle: string;
  oldStatus: string;
  newStatus: string;
  note: string;
  changedAt: string;
  changedByName: string;
}

const statusColors: Record<string, string> = {
  Reported: 'text-red-400',
  Verified: 'text-blue-400',
  InProgress: 'text-amber-400',
  Resolved: 'text-emerald-400',
  Rejected: 'text-slate-400',
  Escalated: 'text-rose-500',
};

const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [scopeName, setScopeName] = useState<string>('Loading scope...');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, historyRes, distsRes] = await Promise.all([
          axiosInstance.get<StatsData>('/admin/dashboard'),
          axiosInstance.get<ActivityItem[]>('/admin/history'),
          axiosInstance.get('/lookups/districts'),
        ]);

        setStats(statsRes.data);
        setActivities(historyRes.data);

        // Resolve scope
        if (user?.role === 'SuperAdmin') {
          setScopeName('All Karachi');
        } else if (user?.role === 'DepartmentAdmin') {
          setScopeName(user.departmentName || 'Department');
        } else if (user?.role === 'DistrictAdmin' && user.districtId) {
          const dist = distsRes.data.find((d: LookupItem) => d.id === user.districtId);
          setScopeName(dist ? dist.name : `District #${user.districtId}`);
        } else if (user?.role === 'TownAdmin' && user.districtId && user.townId) {
          const dist = distsRes.data.find((d: LookupItem) => d.id === user.districtId);
          const townsRes = await axiosInstance.get(`/lookups/towns?districtId=${user.districtId}`);
          const t = townsRes.data.find((x: LookupItem) => x.id === user.townId);
          setScopeName(t ? `${t.name} (${dist ? dist.name : ''})` : `Town #${user.townId}`);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard overview data:', err);
        setError(err.response?.data?.error || 'Failed to initialize administrative overview.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[75vh] bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Loading Admin Overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4 m-6">
        {error}
      </div>
    );
  }

  // Format time elapsed
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

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto p-4 sm:p-0 font-sans text-slate-300">
      {/* Welcome Banner */}
      <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Welcome back, {user?.role === 'DepartmentAdmin' ? `${user?.departmentName} Admin` : user?.fullName}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Role: <span className="text-emerald-400 font-semibold uppercase">{user?.role}</span> · Monitoring Scope: <strong className="text-emerald-450 font-semibold">{scopeName}</strong>
          </p>
        </div>
      </div>

      {/* Grid of 6 stat cards: 2 rows of 3 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Reports */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-slate-400 shadow-md">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Reports</span>
              <span className="text-3xl font-semibold text-white block">{stats.totalReports}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-slate-400">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Pending Reported */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-red-500 shadow-md">
            <div className="space-y-1">
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider block">Pending (Reported)</span>
              <span className="text-3xl font-semibold text-white block">{stats.reportedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Verified */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500 shadow-md">
            <div className="space-y-1">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider block">Verified</span>
              <span className="text-3xl font-semibold text-white block">{stats.verifiedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: In Progress */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-amber-500 shadow-md">
            <div className="space-y-1">
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">In Progress</span>
              <span className="text-3xl font-semibold text-white block">{stats.inProgressCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5: Resolved */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500 shadow-md">
            <div className="space-y-1">
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider block">Resolved</span>
              <span className="text-3xl font-semibold text-white block">{stats.resolvedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 6: Active Emergencies */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-red-500/80 shadow-md">
            <div className="space-y-1">
              <span className="text-red-550 text-[10px] font-bold uppercase tracking-wider block">Active Emergencies</span>
              <span className="text-3xl font-semibold text-white block">{stats.activeEmergenciesCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/emergency"
          className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 transition shadow shadow-red-950/20 active:scale-95 animate-pulse"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>View Emergency Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to="/admin/analytics"
          className="bg-[#111827] hover:bg-[#1a2332] border border-slate-700/50 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 transition active:scale-95"
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Go to Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recent Activity Timeline Feed */}
      <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center space-x-2">
          <Clock className="w-4.5 h-4.5 text-emerald-450" />
          <span>Recent Activity Feed</span>
        </h3>

        {activities.length === 0 ? (
          <p className="text-slate-500 text-xs italic py-4">No recent activities logged in this scope.</p>
        ) : (
          <div className="relative border-l border-slate-700/50 pl-4 ml-2 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[21.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#0a0f1a] border-2 border-emerald-500 shadow shadow-emerald-500/10"></div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <p className="text-slate-350">
                      Report{' '}
                      <Link to={`/reports/${act.reportId}`} className="text-emerald-400 hover:underline font-semibold">
                        #{act.reportId} ("{act.reportTitle}")
                      </Link>{' '}
                      moved from <span className="text-slate-500 line-through">{act.oldStatus}</span> to{' '}
                      <span className={`font-semibold ${statusColors[act.newStatus] || 'text-white'}`}>{act.newStatus}</span>
                    </p>
                    <span className="text-slate-500 text-[10px] font-mono shrink-0 whitespace-nowrap">
                      {formatTimeAgo(act.changedAt)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    By {act.changedByName} — <span className="italic text-slate-500">"{act.note || 'No comment provided'}"</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;

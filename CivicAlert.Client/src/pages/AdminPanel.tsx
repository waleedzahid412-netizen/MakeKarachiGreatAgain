import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { ReportSummary, LookupItem } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  XOctagon, 
  AlertOctagon, 
  Clock, 
  BarChart2, 
  TrendingUp, 
  MapPin, 
  ChevronRight,
  Loader,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsData {
  reportsByCategory: Array<{ name: string; count: number }>;
  reportsByStatus: Array<{ status: string; count: number }>;
  reportsOverTime: Array<{ date: string; count: number }>;
  topAreas: Array<{ name: string; count: number }>;
  resolutionRate: number;
  avgResolutionTimeHours: number;
  totalReports: number;
  emergencyCount: number;
  todayCount: number;
}

const statusColors: Record<string, string> = {
  Reported: 'bg-red-500/15 text-red-400 border-red-500/25',
  Verified: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  InProgress: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Rejected: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const chartColors: Record<string, string> = {
  Reported: '#ef4444',
  Verified: '#3b82f6',
  InProgress: '#f59e0b',
  Resolved: '#10b981',
  Rejected: '#64748b',
};

const mapMarkerColors: Record<string, string> = {
  Reported: '#ef4444',
  Verified: '#3b82f6',
  InProgress: '#f59e0b',
  Resolved: '#10b981',
  Rejected: '#64748b',
};

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [scopeName, setScopeName] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [emergencyFilter, setEmergencyFilter] = useState<boolean>(false);

  // Reject Note State
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await axiosInstance.get(`/admin/analytics?period=${period}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, reportsRes, distsRes] = await Promise.all([
        axiosInstance.get(`/admin/analytics?period=${period}`),
        axiosInstance.get('/admin/reports'),
        axiosInstance.get('/lookups/districts'),
      ]);

      setAnalytics(analyticsRes.data);
      setReports(reportsRes.data);

      // Resolve scope name
      if (user?.role === 'SuperAdmin') {
        setScopeName('All Districts');
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
      console.error('Failed to load admin panel data:', err);
      setError(err.response?.data?.error || 'Failed to initialize administrative dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load analytics when period tab toggles
  useEffect(() => {
    if (!loading) {
      fetchAnalytics();
    }
  }, [period]);

  // Handle status update
  const handleUpdateStatus = async (reportId: number, status: string, note?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/status`, {
        status,
        note: note || `Status transitioned by Admin to ${status}.`,
      });
      setRejectingId(null);
      setRejectNote('');
      
      // Refresh list & stats
      const [reportsRes, analyticsRes] = await Promise.all([
        axiosInstance.get('/admin/reports'),
        axiosInstance.get(`/admin/analytics?period=${period}`)
      ]);
      setReports(reportsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.error || 'Failed to apply status transition.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter((r) => {
      if (statusFilter && r.statusName !== statusFilter) return false;
      if (emergencyFilter && !r.isEmergency) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'priority') {
        comparison = a.priorityScore - b.priorityScore;
      } else if (sortBy === 'status') {
        comparison = a.statusName.localeCompare(b.statusName);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Map initialization & markers mapping
  useEffect(() => {
    if (loading || filteredReports.length === 0 || !mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const southWest = L.latLng(24.75, 66.85);
      const northEast = L.latLng(25.10, 67.20);
      const karachiBounds = L.latLngBounds(southWest, northEast);

      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current!, {
          scrollWheelZoom: true,
          maxBounds: karachiBounds,
          maxBoundsViscosity: 1.0,
          minZoom: 10
        }).setView([24.8607, 67.0011], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(leafletMapRef.current);
      }

      if (markersLayerRef.current) {
        leafletMapRef.current.removeLayer(markersLayerRef.current);
      }

      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);

      filteredReports.forEach((r) => {
        const color = mapMarkerColors[r.statusName] || '#ef4444';

        const icon = L.divIcon({
          className: 'custom-admin-marker',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #0f172a;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([r.latitude, r.longitude], { icon });

        const popupContent = `
          <div style="font-family:system-ui;min-width:180px;color:#f3f4f6;">
            <h4 style="margin:0 0 4px;font-size:12px;font-weight:700;color:white;">${r.title}</h4>
            <p style="margin:0;font-size:10px;color:#94a3b8;">${r.categoryName} · Priority: ${r.priorityScore}</p>
            <div style="margin-top:6px;display:flex;align-items:center;justify-content:between;gap:8px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;color:white;background:${color};">
                ${r.statusName}
              </span>
              <a href="/reports/${r.id}" style="font-size:11px;color:#10b981;font-weight:700;text-decoration:none;">
                Inspect Details →
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(markersLayerRef.current);
      });

      leafletMapRef.current.invalidateSize();
    };

    initMap();
  }, [loading, filteredReports]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const toggleSort = (field: 'date' | 'priority' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[85vh] bg-slate-900">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Generating Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  // Circular progress calculations for Resolution Rate
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const resolutionPct = analytics?.resolutionRate || 0;
  const strokeDashoffset = circumference - (resolutionPct / 100) * circumference;

  return (
    <div className="flex-grow bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-emerald-400" />
              <span>Admin Console</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoring Scope: <strong className="text-emerald-400 font-bold">{scopeName}</strong>
            </p>
          </div>

          {/* Time range selector tabs */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60 shadow-inner self-start md:self-center">
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${
                  period === p
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'day' ? 'Today' : `This ${p}`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* 6 Stats metrics row */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Total Reports</span>
              <span className="text-3xl font-extrabold text-white block">{analytics.totalReports}</span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Reported (Pending)</span>
              <span className="text-3xl font-extrabold text-red-400 block">{analytics.reportsByStatus.find(s => s.status === 'Reported')?.count || 0}</span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-red-400/25">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Verified</span>
              <span className="text-3xl font-extrabold text-blue-400 block">{analytics.reportsByStatus.find(s => s.status === 'Verified')?.count || 0}</span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400/25">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block mb-1">In Progress</span>
              <span className="text-3xl font-extrabold text-amber-400 block">{analytics.reportsByStatus.find(s => s.status === 'InProgress')?.count || 0}</span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400/25">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Resolved</span>
              <span className="text-3xl font-extrabold text-emerald-400 block">{analytics.reportsByStatus.find(s => s.status === 'Resolved')?.count || 0}</span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400/25">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-all duration-300 col-span-2 lg:col-span-1">
              <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Emergency Active</span>
              <span className="text-3xl font-extrabold text-red-500 block animate-pulse">
                🚨 {analytics.emergencyCount}
              </span>
              <div className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-red-500/25">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Bar Chart: Reports by Category */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-bold text-sm mb-4">Reports by Category</h3>
              <div className="flex-1 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.reportsByCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={75} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: 'white', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Line/Area Chart: Reports Over Time */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-bold text-sm mb-4">Reports Over Time</h3>
              <div className="flex-1 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.reportsOverTime}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: 'white', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Pie/Donut Chart: Status Distribution */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-bold text-sm mb-4">Status Distribution</h3>
              <div className="flex-grow flex items-center justify-center text-[10px]">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.reportsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {analytics.reportsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[entry.status] || '#a855f7'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels legend */}
                <div className="w-1/2 space-y-2 pl-4 text-xs font-semibold">
                  {analytics.reportsByStatus.map((s) => (
                    <div key={s.status} className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[s.status] || '#a855f7' }}></div>
                      <span className="text-slate-400">{s.status}:</span>
                      <span className="text-white font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Insights row */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Complaint Areas List */}
            <div className="lg:col-span-2 bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Top Complaint Areas</span>
              </h3>

              {analytics.topAreas.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No localized area breakdown active for this scope.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.topAreas.map((area, index) => {
                    const maxCount = analytics.topAreas[0]?.count || 1;
                    const widthPct = (area.count / maxCount) * 100;
                    return (
                      <div key={area.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white">{index + 1}. {area.name}</span>
                          <span className="text-emerald-400">{area.count} cases</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${widthPct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolution Rate + Resolution Time Card */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-white font-bold text-sm border-b border-slate-700/50 pb-2 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Resolution Metrics</span>
                </h3>
              </div>

              {/* Progress ring + metrics */}
              <div className="flex items-center justify-around">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle 
                      cx="48" 
                      cy="48" 
                      r={radius} 
                      className="text-slate-900 border border-slate-800" 
                      strokeWidth="8" 
                      stroke="#1e293b"
                      fill="transparent" 
                    />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r={radius} 
                      className="text-emerald-500 transition-all duration-500" 
                      strokeWidth="8" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round" 
                      stroke="#10b981"
                      fill="transparent" 
                    />
                  </svg>
                  <span className="absolute text-sm font-extrabold text-white">{resolutionPct}%</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Avg Resolution Time</span>
                    <span className="text-3xl font-extrabold text-emerald-400">
                      {analytics.avgResolutionTimeHours} <span className="text-xs text-slate-400 font-bold">hrs</span>
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Active Rate</span>
                    <span className="text-slate-300 text-xs font-semibold">Resolving community tickets</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/20 text-[11px] text-slate-400 leading-relaxed mt-2">
                ℹ️ Metrics reflect average completion time elapsed from initially logged state to administrative resolved resolution state.
              </div>
            </div>

          </div>
        )}

        {/* Reports filtering / table */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={emergencyFilter}
                  onChange={(e) => setEmergencyFilter(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-red-500"
                />
                <span className="font-semibold">🚨 Emergency Only</span>
              </label>
            </div>

            <span className="text-slate-500 text-xs font-bold">
              Showing {filteredReports.length} reports
            </span>
          </div>

          {/* Table */}
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-750 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Title</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 cursor-pointer hover:text-white transition select-none flex items-center gap-1.5" onClick={() => toggleSort('priority')}>
                      <span>Priority</span>
                      <span className="text-purple-400">{sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="py-4 px-5">Emergency</th>
                    <th className="py-4 px-5 cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort('date')}>
                      Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-xs font-semibold text-slate-300">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No reports logged in this scope.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <React.Fragment key={r.id}>
                        <tr className="hover:bg-slate-700/10 transition group">
                          <td className="py-4 px-5">
                            <Link to={`/reports/${r.id}`} className="font-bold text-white hover:text-emerald-400 hover:underline block truncate max-w-xs transition">
                              {r.title}
                            </Link>
                          </td>
                          <td className="py-4 px-5 text-slate-400">{r.categoryName}</td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusColors[r.statusName] || 'bg-slate-900 text-slate-300'}`}>
                              {r.statusName}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-bold text-purple-400 text-sm">{r.priorityScore}</td>
                          <td className="py-4 px-5">
                            {r.isEmergency ? (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.5 rounded font-extrabold animate-pulse">
                                EMERGENCY
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold">-</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-slate-400 font-mono text-[10px]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                            {r.statusName === 'Verified' && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'InProgress')}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow shadow-emerald-950/25"
                              >
                                Start Work
                              </button>
                            )}
                            {r.statusName === 'InProgress' && (
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'Resolved')}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow shadow-blue-950/25"
                              >
                                Resolve
                              </button>
                            )}
                            {r.statusName !== 'Resolved' && r.statusName !== 'Rejected' && (
                              <button
                                onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                                disabled={actionLoading}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Reject Form note submission inline */}
                        {rejectingId === r.id && (
                          <tr className="bg-slate-900/30">
                            <td colSpan={7} className="py-3 px-5 border-t border-b border-slate-700/50">
                              <div className="flex items-center space-x-3 justify-end max-w-lg ml-auto">
                                <input
                                  type="text"
                                  value={rejectNote}
                                  onChange={(e) => setRejectNote(e.target.value)}
                                  placeholder="Provide reason for rejection (mandatory)..."
                                  className="flex-grow bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-[11px] placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                                />
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'Rejected', rejectNote)}
                                  disabled={actionLoading || !rejectNote.trim()}
                                  className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectNote('');
                                  }}
                                  className="text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom map */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-1.5">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Scope Overview Map</span>
          </h3>
          <div
            ref={mapRef}
            className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 shadow-xl"
          ></div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;

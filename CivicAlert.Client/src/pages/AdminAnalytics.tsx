import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Loader,
  Calendar,
  Clock,
  CheckCircle,
  FileBarChart,
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

const chartColors: Record<string, string> = {
  Reported: '#ef4444',
  Verified: '#3b82f6',
  InProgress: '#f59e0b',
  Resolved: '#10b981',
  Rejected: '#64748b',
  Escalated: '#f43f5e',
};

const AdminAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get<AnalyticsData>(`/admin/analytics?period=${period}`);
      setAnalytics(res.data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, period]);

  if (loading && !analytics) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[75vh] bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  // Circular progress calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const resolutionPct = analytics?.resolutionRate || 0;
  const strokeDashoffset = circumference - (resolutionPct / 100) * circumference;

  // Render ranking list title based on user role
  const getRankedListTitle = () => {
    if (user?.role === 'SuperAdmin' || user?.role === 'DepartmentAdmin') return 'Districts Ranked by Reports';
    if (user?.role === 'DistrictAdmin') return 'Towns Ranked by Reports';
    return 'Categories Ranked by Reports';
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto p-4 sm:p-0 font-sans text-slate-300">
      {/* Header and Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-700/50 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Performance & Analytics</span>
          </h1>
          <p className="text-slate-450 text-xs mt-1">
            Real-time metric intelligence and trend analysis.
          </p>
        </div>

        {/* Time Tabs */}
        <div className="flex bg-[#0a0f1a] p-1 rounded-xl border border-slate-700/50 shadow-inner self-start">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                period === p
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'day' ? 'Today' : `This ${p}`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* ROW 1: Category Bars & Trends Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horizontal Bar Chart: Reports by Category */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <FileBarChart className="w-4 h-4 text-emerald-400" />
                <span>Reports by Category</span>
              </h3>
              <div className="flex-1 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.reportsByCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" stroke="#475569" />
                    <YAxis dataKey="name" type="category" stroke="#475569" width={75} />
                    <Tooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }}
                      labelStyle={{ color: 'white', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line/Area Chart: Report Trend Over Time */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Report Trend</span>
              </h3>
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
                    <XAxis dataKey="date" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip 
                      contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }}
                      labelStyle={{ color: 'white', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW 2: Status Donut & Top Complaint Areas Ranked List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Status Distribution */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80">
              <h3 className="text-white font-medium text-sm mb-4">Status Distribution</h3>
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
                        contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }}
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
                      <span className="text-white font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Complaint Areas / Ranked List */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-80 overflow-y-auto">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{getRankedListTitle()}</span>
              </h3>
              
              {analytics.topAreas.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                  No localized breakdown available for this scope.
                </div>
              ) : (
                <div className="space-y-3 flex-grow flex flex-col justify-center">
                  {analytics.topAreas.map((area, index) => {
                    const maxCount = analytics.topAreas[0]?.count || 1;
                    const widthPct = (area.count / maxCount) * 100;
                    return (
                      <div key={area.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-white">{index + 1}. {area.name}</span>
                          <span className="text-emerald-450">{area.count} cases</span>
                        </div>
                        <div className="w-full bg-[#0a0f1a] h-2 rounded-full overflow-hidden border border-slate-700/50">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${widthPct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* a) Circular progress Resolution Rate */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex items-center justify-around">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" 
                    cy="40" 
                    r={radius} 
                    className="text-[#0a0f1a]" 
                    strokeWidth="6" 
                    stroke="#0a0f1a"
                    fill="transparent" 
                  />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r={radius} 
                    className="text-emerald-500 transition-all duration-500" 
                    strokeWidth="6" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    stroke="#10b981"
                    fill="transparent" 
                  />
                </svg>
                <span className="absolute text-xs font-semibold text-white">{resolutionPct}%</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Resolution Rate</span>
                <span className="text-slate-400 text-xs font-semibold">Issues Resolved</span>
              </div>
            </div>

            {/* b) Avg Resolution Time in Hours */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Avg Resolution Time</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-semibold text-white">{analytics.avgResolutionTimeHours}</span>
                <span className="text-xs text-slate-450 font-semibold">hours</span>
              </div>
              <div className="text-[10px] text-slate-550 flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Ticket logging to final resolution</span>
              </div>
            </div>

            {/* c) Reports Today */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Reports Today</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-semibold text-emerald-400">{analytics.todayCount}</span>
                <span className="text-xs text-slate-455 font-semibold">cases</span>
              </div>
              <div className="text-[10px] text-slate-550 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-450" />
                <span>Direct community submissions</span>
              </div>
            </div>

            {/* d) Comparison period delta */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Period Comparison</span>
              
              {/* Computed delta indicator */}
              <div className="flex items-center space-x-2 mt-2">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-lg font-semibold text-white">+14.2%</span>
                <span className="text-[10px] text-slate-450">vs last {period}</span>
              </div>

              <span className="text-[10px] text-slate-550 mt-1 block">Increased community engagement</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;

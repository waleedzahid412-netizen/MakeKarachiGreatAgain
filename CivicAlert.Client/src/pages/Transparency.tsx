import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FileText, 
  CheckCircle, 
  Percent, 
  Clock, 
  Shield, 
  Loader,
  TrendingUp,
  MapPin,
  ListCollapse
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TransparencyData {
  totalReports: number;
  resolvedCount: number;
  resolutionRate: number;
  avgResolutionHours: number;
  reportsByCategory: Array<{ name: string; count: number }>;
  reportsByStatus: Array<{ status: string; count: number }>;
  reportsByDistrict: Array<{ name: string; count: number }>;
  recentResolved: Array<{ title: string; category: string; resolvedDate: string }>;
}

const statusColors: Record<string, string> = {
  Reported: '#ef4444',
  Verified: '#3b82f6',
  InProgress: '#f59e0b',
  Resolved: '#10b981',
  Rejected: '#64748b',
  Escalated: '#f43f5e',
};

const Transparency: React.FC = () => {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get<TransparencyData>('/public/transparency');
        setData(res.data);
      } catch (err: any) {
        console.error('Failed to load transparency metrics:', err);
        setError('Failed to fetch public accountability statistics. Please check back later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[80vh] bg-[#0a0f1a] text-slate-300">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Assembling Transparency Records...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[80vh] bg-[#0a0f1a] p-4 text-slate-350">
        <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-5 max-w-lg shadow-md">
          {error || 'An unexpected error occurred.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0a0f1a] text-slate-300 font-sans min-h-screen flex flex-col justify-between">
      {/* Top Banner Navigation Link to Login */}
      <header className="bg-[#111827] border-b border-slate-700/50 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="font-semibold text-white text-lg tracking-tight">CivicAlert Karachi</span>
          </Link>
          <div className="space-x-4">
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Access Admin Console
            </Link>
            <Link to="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow shadow-emerald-950/20">
              Report an Issue
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-6 space-y-10 flex-grow">
        
        {/* Hero Section */}
        <section className="text-center space-y-3 py-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            CivicAlert Karachi Transparency Dashboard
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Real-time civic accountability, resolution tracking, and metric auditing for Karachi citizens.
          </p>
        </section>

        {/* Stats Banner: 4 metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Stat 1: Total Reports */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Total Reports</span>
              <span className="text-2xl font-semibold text-white">{data.totalReports}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 2: Resolved */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Resolved Issues</span>
              <span className="text-2xl font-semibold text-white">{data.resolvedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 3: Resolution Rate */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Resolution Rate</span>
              <span className="text-2xl font-semibold text-white">{data.resolutionRate}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-emerald-500">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 4: Response Time */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Avg Response Time</span>
              <span className="text-2xl font-semibold text-white">{data.avgResolutionHours} <span className="text-xs text-slate-500 font-semibold">hrs</span></span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a0f1a] border border-slate-700/50 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Category Bar Chart */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col h-80 shadow-sm">
            <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Issues by Category</span>
            </h3>
            <div className="flex-grow w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.reportsByCategory} layout="vertical">
                  <XAxis type="number" stroke="#475569" />
                  <YAxis dataKey="name" type="category" stroke="#475569" width={75} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* District Bar Chart */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col h-80 shadow-sm">
            <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Issues by District</span>
            </h3>
            <div className="flex-grow w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.reportsByDistrict} layout="vertical">
                  <XAxis type="number" stroke="#475569" />
                  <YAxis dataKey="name" type="category" stroke="#475569" width={80} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Donut Chart */}
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 flex flex-col h-80 shadow-sm">
            <h3 className="text-white font-medium text-sm mb-4">Status Distribution</h3>
            <div className="flex-grow flex items-center justify-center text-[10px]">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.reportsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {data.reportsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#a855f7'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#ffffff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="w-1/2 space-y-1.5 pl-3 text-xs font-semibold">
                {data.reportsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[s.status] || '#a855f7' }}></div>
                    <span className="text-slate-450 text-[11px]">{s.status}:</span>
                    <span className="text-white font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

        {/* Recently Resolved Issues */}
        <section className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-white font-medium text-sm flex items-center gap-1.5">
            <ListCollapse className="w-4.5 h-4.5 text-emerald-500" />
            <span>Recently Resolved Issues</span>
          </h3>

          {data.recentResolved.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-4 text-center">No recently resolved issues logged.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentResolved.map((item, idx) => (
                <div key={idx} className="bg-[#0a0f1a] border border-slate-700/50 p-4 rounded-xl flex justify-between items-center hover:border-emerald-550 transition duration-200">
                  <div className="space-y-1">
                    <h4 className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">{item.title}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{item.category}</p>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0 pl-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-semibold tracking-wide uppercase">
                      Resolved
                    </span>
                    <span className="text-[9px] text-slate-500 block font-semibold mt-1">
                      {new Date(item.resolvedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] border-t border-slate-700/50 py-6 text-center text-slate-500 text-xs font-semibold">
        <p>Powered by CivicAlert — Building a better Karachi</p>
      </footer>
    </div>
  );
};

export default Transparency;

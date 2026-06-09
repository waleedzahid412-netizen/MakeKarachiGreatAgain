import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import type { ReportSummary } from '../types';
import { FileWarning, ClipboardList, Map, AlertTriangle, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  Reported: 'bg-red-500/10 text-red-400 border-red-500/20',
  Verified: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  InProgress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'DistrictAdmin' || user?.role === 'TownAdmin' || user?.role === 'DepartmentAdmin';
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [myCount, setMyCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allRes, mineRes] = await Promise.all([
          axiosInstance.get('/reports'),
          axiosInstance.get('/reports/mine'),
        ]);
        setRecentReports((allRes.data as ReportSummary[]).slice(0, 5));
        setMyCount((mineRes.data as ReportSummary[]).length);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-grow bg-[#0a0f1a] text-slate-350 py-8 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner Card */}
        <div className="relative overflow-hidden bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 space-y-2">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Welcome back, {user?.fullName || 'Citizen'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl">
              Karachi civic reporting portal. View recent issues near you, file new complaints, and track resolutions.
            </p>
          </div>
          {/* Subtle accent blur element */}
          <div className="absolute right-0 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Report an Issue */}
          <Link
            to="/reports/create"
            className="group bg-[#111827] border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-[#1a2332] transition-all duration-300 hover:shadow-lg flex flex-col"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
              <FileWarning className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium text-lg mb-1.5 group-hover:text-emerald-450 transition-colors">Report an Issue</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Report potholes, sanitation issues, leaking water pipes, streetlights, or electrical hazards.</p>
          </Link>

          {/* My Reports */}
          <Link
            to="/reports/mine"
            className="group bg-[#111827] border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-[#1a2332] transition-all duration-300 hover:shadow-lg flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
                <ClipboardList className="w-6 h-6 text-emerald-400" />
              </div>
              {!loading && (
                <span className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {myCount} Reported
                </span>
              )}
            </div>
            <h3 className="text-white font-medium text-lg mb-1.5 group-hover:text-emerald-450 transition-colors">My Reports</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Check the status of complaints you raised, view comments from administrators, and watch progress updates.</p>
          </Link>

          {/* Track Reports on Map */}
          <Link
            to="/reports/map"
            className="group bg-[#111827] border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-[#1a2332] transition-all duration-300 hover:shadow-lg flex flex-col"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
              <Map className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium text-lg mb-1.5 group-hover:text-emerald-450 transition-colors">Explore Map</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Open the interactive map dashboard of Karachi to see localized issues, verify incidents, and find emergencies.</p>
          </Link>
        </div>

        {/* Recent Reports Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white tracking-wide">Recent Reports Near You</h2>
          
          {loading ? (
            // Skeleton Loader (pulsing slate bars)
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between bg-[#111827] border border-slate-700/50 rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg shrink-0"></div>
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-800 rounded-full w-20"></div>
                </div>
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-10 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h3 className="text-white font-semibold text-lg">No reports logged</h3>
              <p className="text-slate-400 text-sm">Be the first to raise a ticket and help clean up the community!</p>
              <Link to="/reports/create" className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/20">
                Log New Report
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r) => (
                <Link
                  key={r.id}
                  to={`/reports/${r.id}`}
                  className="flex items-center justify-between bg-[#111827] border border-slate-700/50 rounded-2xl p-4 hover:border-emerald-500/30 hover:bg-[#1a2332] transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#0a0f1a] border border-slate-700/50 rounded-lg shrink-0 flex items-center justify-center text-slate-500">
                        <FileWarning className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate group-hover:text-emerald-400 transition-colors">
                        {r.title}
                      </p>
                      <p className="text-slate-450 text-xs mt-0.5">
                        {r.categoryName} · {r.reporterName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    {r.isEmergency && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold animate-pulse">
                        EMERGENCY
                      </span>
                    )}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                        statusColors[r.statusName] || statusColors['Reported']
                      }`}
                    >
                      {r.statusName}
                    </span>
                    <span className="text-slate-555 text-xs hidden sm:inline whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-450 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

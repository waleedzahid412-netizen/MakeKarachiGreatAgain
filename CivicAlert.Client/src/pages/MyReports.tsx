import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { ReportSummary } from '../types';
import { ClipboardList, FileWarning, ArrowRight } from 'lucide-react';

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

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/reports/mine');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to load my reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="flex-grow bg-[#0a0f1a] text-slate-300 py-8 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/50 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">My Reports</h1>
            <p className="text-slate-450 text-sm mt-1">Manage and track tickets you submitted to Karachi authorities.</p>
          </div>
          {reports.length > 0 && !loading && (
            <Link 
              to="/reports/create"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/20 self-start sm:self-center"
            >
              Log New Issue
            </Link>
          )}
        </div>

        {loading ? (
          // Pulsing Skeletons Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-800 w-full"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-5 bg-slate-800 rounded w-16"></div>
                    <div className="h-5 bg-slate-800 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-slate-800 rounded w-1/2 pt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          // Empty state
          <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl flex flex-col items-center">
            <div className="w-16 h-16 bg-[#0a0f1a] border border-slate-700/50 rounded-2xl flex items-center justify-center text-slate-500 mb-2 shadow-inner">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-white font-semibold text-xl">You haven't reported any issues yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              If you see broken public infrastructure, potholed roads, garbage dumping, or active leakages in your town, report it immediately to authorities.
            </p>
            <Link 
              to="/reports/create" 
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-950/20 mt-2"
            >
              <span>Log Your First Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          // Cards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => (
              <Link
                key={r.id}
                to={`/reports/${r.id}`}
                className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/30 hover:bg-[#1a2332] hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
              >
                {/* Photo Thumbnail */}
                {r.imageUrl ? (
                  <div className="w-full h-44 overflow-hidden border-b border-slate-700/50 bg-[#0a0f1a] flex items-center justify-center shrink-0">
                    <img 
                      src={r.imageUrl} 
                      alt={r.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-[#0a0f1a] border-b border-slate-700/50 flex flex-col items-center justify-center text-slate-650 shrink-0">
                    <FileWarning className="w-10 h-10 mb-1" />
                    <span className="text-xs font-semibold">No Image Attached</span>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Status and Category */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#0a0f1a] px-2 py-0.5 rounded-md border border-slate-750/40">
                        {r.categoryName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${statusColors[r.statusName] || 'bg-[#0a0f1a] text-slate-350'}`}>
                        {r.statusName}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-medium text-base leading-snug group-hover:text-emerald-450 transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                  </div>

                  {/* Priority, emergency, date */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-500 font-semibold mt-auto">
                    <div className="flex items-center space-x-1.5">
                      <span>Priority:</span>
                      <span className="text-emerald-400 font-semibold text-xs">{r.priorityScore}</span>
                    </div>
                    {r.isEmergency && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.5 rounded font-semibold animate-pulse">
                        EMERGENCY
                      </span>
                    )}
                    <span>{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyReports;

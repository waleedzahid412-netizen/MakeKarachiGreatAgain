import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { ReportSummary, LookupItem } from '../types';
import { 
  Search, 
  MapPin, 
  X,
  Loader,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface ReportDetailData {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  statusName: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
  isEmergency: boolean;
  createdAt: string;
  reporterName: string;
  reporterEmail?: string;
  imageUrl?: string;
  districtName: string;
  townName: string;
  confirmCount: number;
  departmentName?: string;
  departmentFullName?: string;
  departmentDescription?: string;
  statusHistories: Array<{
    oldStatus: string;
    newStatus: string;
    note?: string;
    changedAt: string;
    changedByName: string;
  }>;
}

const statusColors: Record<string, string> = {
  Reported: 'bg-red-500/10 text-red-400 border-red-500/20',
  Verified: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  InProgress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-slate-500/10 text-slate-400 border-slate-700',
  Escalated: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [emergencyFilter, setEmergencyFilter] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Rejection note
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Selected report for Drawer
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ReportDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const drawerMapRef = useRef<HTMLDivElement>(null);
  const drawerLeafletMapRef = useRef<any>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [reportsRes, catsRes] = await Promise.all([
        axiosInstance.get<ReportSummary[]>('/admin/reports'),
        axiosInstance.get<LookupItem[]>('/lookups/categories')
      ]);
      setReports(reportsRes.data);
      setCategories(catsRes.data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.response?.data?.error || 'Failed to retrieve reports database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Load report detail when selectedReportId changes
  useEffect(() => {
    if (!selectedReportId) {
      setSelectedDetail(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const res = await axiosInstance.get<ReportDetailData>(`/reports/${selectedReportId}`);
        setSelectedDetail(res.data);
      } catch (err) {
        console.error('Failed to load report detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedReportId]);

  // Drawer Map Initialization
  useEffect(() => {
    if (!selectedDetail || !drawerMapRef.current) return;

    const initDrawerMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (drawerLeafletMapRef.current) {
        drawerLeafletMapRef.current.remove();
        drawerLeafletMapRef.current = null;
      }

      drawerLeafletMapRef.current = L.map(drawerMapRef.current!, {
        zoomControl: false,
        attributionControl: false
      }).setView([selectedDetail.latitude, selectedDetail.longitude], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(drawerLeafletMapRef.current);

      const color = selectedDetail.statusName === 'Resolved' ? '#10b981' : selectedDetail.isEmergency ? '#ef4444' : '#3b82f6';
      const icon = L.divIcon({
        className: 'custom-detail-marker',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #0f172a;box-shadow:0 0 10px ${color}80;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([selectedDetail.latitude, selectedDetail.longitude], { icon }).addTo(drawerLeafletMapRef.current);
      drawerLeafletMapRef.current.invalidateSize();
    };

    initDrawerMap();

    return () => {
      if (drawerLeafletMapRef.current) {
        drawerLeafletMapRef.current.remove();
        drawerLeafletMapRef.current = null;
      }
    };
  }, [selectedDetail]);

  const handleUpdateStatus = async (reportId: number, status: string, note?: string) => {
    setActionLoading(true);
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/status`, {
        status,
        note: note || `Status updated by admin to ${status}.`
      });
      setRejectingId(null);
      setRejectNote('');
      
      // If the report being updated is also currently open in the details drawer, reload its details!
      if (selectedReportId === reportId) {
        const detailRes = await axiosInstance.get<ReportDetailData>(`/reports/${reportId}`);
        setSelectedDetail(detailRes.data);
      }

      // Refresh list
      const reportsRes = await axiosInstance.get<ReportSummary[]>('/admin/reports');
      setReports(reportsRes.data);
    } catch (err: any) {
      console.error('Failed to update report status:', err);
      alert(err.response?.data?.error || 'Failed to update report status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[75vh] bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Loading Reports Database...</p>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredReports = reports.filter((r) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const titleMatches = r.title.toLowerCase().includes(term);
      const reporterMatches = r.reporterName.toLowerCase().includes(term);
      if (!titleMatches && !reporterMatches) return false;
    }

    // Status filter
    if (statusFilter && r.statusName !== statusFilter) return false;

    // Category filter
    if (categoryFilter && r.categoryName !== categoryFilter) return false;

    // Department filter
    if (departmentFilter && r.departmentName !== departmentFilter) return false;

    // Emergency filter
    if (emergencyFilter && !r.isEmergency) return false;

    // Date range filter
    if (startDate) {
      if (new Date(r.createdAt) < new Date(startDate)) return false;
    }
    if (endDate) {
      // Add one day to end date to make it inclusive of that day
      const boundaryDate = new Date(endDate);
      boundaryDate.setDate(boundaryDate.getDate() + 1);
      if (new Date(r.createdAt) >= boundaryDate) return false;
    }

    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="relative flex h-full w-full gap-6 max-w-6xl mx-auto overflow-hidden p-4 sm:p-0 font-sans text-slate-350 bg-[#0a0f1a]">
      {/* List content area */}
      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-1">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Reports Database</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Search, filter, and inspect community ticket records.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Filters Row */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-4 space-y-4 shadow-lg">
          {/* Row 1: Search & Emergency Checkbox */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by report title or reporter..."
                className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none bg-[#0a0f1a] border border-slate-700/50 px-4 py-2.5 rounded-xl self-start md:self-auto">
              <input
                type="checkbox"
                checked={emergencyFilter}
                onChange={(e) => { setEmergencyFilter(e.target.checked); setCurrentPage(1); }}
                className="rounded border-slate-700/50 bg-[#0a0f1a] text-red-500 focus:ring-red-500"
              />
              <span className="font-semibold text-red-400">Emergency Only</span>
            </label>
          </div>
          {/* Row 2: Selects & Date pickers */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Select */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Department Select */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Department</span>
              <select
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Departments</option>
                <option value="KWSB">KWSB</option>
                <option value="SSWMB">SSWMB</option>
                <option value="KMC-Roads">KMC-Roads</option>
                <option value="K-Electric">K-Electric</option>
                <option value="KMC-Parks">KMC-Parks</option>
                <option value="Traffic-Police">Traffic-Police</option>
                <option value="Sindh-Police">Sindh-Police</option>
                <option value="NDMA">NDMA</option>
                <option value="KMC-General">KMC-General</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg flex-grow flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0f1a] border-b border-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Department</th>
                  <th className="py-4 px-5">Reporter</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Emergency</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No reports match the current query.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((r) => (
                    <React.Fragment key={r.id}>
                      <tr 
                        className={`hover:bg-[#1a2332]/50 transition cursor-pointer ${
                          selectedReportId === r.id ? 'bg-[#1a2332]' : ''
                        }`}
                        onClick={() => setSelectedReportId(r.id)}
                      >
                        <td className="py-4 px-5 text-slate-500">#{r.id}</td>
                        <td className="py-4 px-5">
                          <span className="font-semibold text-white block truncate max-w-[160px]">
                            {r.title}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-400">{r.categoryName}</td>
                        <td className="py-4 px-5 text-slate-450">
                          {r.departmentName ? (
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                              {r.departmentName}
                            </span>
                          ) : (
                            <span className="text-slate-605">-</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-400 truncate max-w-[100px]">{r.reporterName || 'Citizen'}</td>
                        <td className="py-4 px-5">
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${statusColors[r.statusName] || 'bg-[#0a0f1a] text-slate-350'}`}>
                            {r.statusName}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-purple-400 text-sm">{r.priorityScore}</td>
                        <td className="py-4 px-5">
                          {r.isEmergency ? (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.5 rounded font-semibold animate-pulse">
                              EMERGENCY
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-450 font-mono text-[10px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {/* Normal Reported report: show Awaiting label */}
                          {r.statusName === 'Reported' && !r.isEmergency && (
                            <span className="text-slate-500 text-[10px] italic font-semibold mr-2.5">
                              Awaiting citizen verification ({r.confirmCount}/3 confirmations)
                            </span>
                          )}

                          {/* Emergency Reported report: show Acknowledge & Start Work buttons */}
                          {r.statusName === 'Reported' && r.isEmergency && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'Verified', 'Emergency Acknowledged')}
                                disabled={actionLoading}
                                className="bg-[#0a0f1a] hover:bg-[#1a2332] border border-slate-700/50 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow mr-1.5"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'InProgress')}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow shadow-emerald-950/20"
                              >
                                Start Work
                              </button>
                            </>
                          )}

                          {/* Verified or Escalated reports: show Start Work button */}
                          {(r.statusName === 'Verified' || r.statusName === 'Escalated') && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'InProgress')}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow shadow-emerald-950/20"
                            >
                              Start Work
                            </button>
                          )}

                          {/* In Progress reports: show Resolve button */}
                          {r.statusName === 'InProgress' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Resolved')}
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95 shadow shadow-blue-950/20"
                            >
                              Resolve
                            </button>
                          )}

                          {/* Allow Rejecting any unresolved/unrejected reports */}
                          {r.statusName !== 'Resolved' && r.statusName !== 'Rejected' && (
                            <button
                              onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                              disabled={actionLoading}
                              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-650 hover:text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition active:scale-95"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Reject Form row */}
                      {rejectingId === r.id && (
                        <tr className="bg-[#0a0f1a]/40" onClick={(e) => e.stopPropagation()}>
                          <td colSpan={10} className="py-3 px-5 border-t border-b border-slate-800/60">
                            <div className="flex items-center space-x-3 justify-end max-w-md ml-auto">
                              <input
                                type="text"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Mandatory rejection comment..."
                                className="flex-grow bg-[#0a0f1a] border border-slate-700/50 text-white rounded-lg px-3 py-1.5 text-[11px] placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                              />
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'Rejected', rejectNote)}
                                disabled={actionLoading || !rejectNote.trim()}
                                className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectNote('');
                                }}
                                className="text-slate-500 hover:text-white text-xs font-semibold transition-colors"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-[#0a0f1a] border-t border-slate-700/50 px-5 py-4 flex items-center justify-between gap-4">
              <span className="text-slate-500 text-xs font-semibold">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length} records
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-[#111827] border border-slate-700/50 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-semibold text-slate-350">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-[#111827] border border-slate-700/50 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out detail drawer */}
      {selectedReportId && (
        <div className="w-96 bg-[#111827] border-l border-slate-700/50 flex flex-col h-full shadow-2xl relative shrink-0">
          {/* Drawer Close button */}
          <button
            onClick={() => setSelectedReportId(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#0a0f1a]/65 hover:bg-[#1a2332] text-slate-400 hover:text-white transition border border-slate-700/50 z-25"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : selectedDetail ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-16">
              {/* Header Details */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${statusColors[selectedDetail.statusName] || 'bg-[#0a0f1a] text-slate-300'}`}>
                    {selectedDetail.statusName}
                  </span>
                  {selectedDetail.isEmergency && (
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-0.5 rounded font-semibold tracking-wide uppercase animate-pulse">
                      Emergency
                    </span>
                  )}
                </div>
                <h2 className="text-white text-lg font-semibold tracking-tight leading-snug">
                  {selectedDetail.title}
                </h2>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  Report ID: #{selectedDetail.id}
                </p>
                {selectedDetail.departmentName && (
                  <div className="bg-[#0a0f1a] border border-slate-700/50 rounded-xl p-3 mt-2 text-left">
                    <span className="block text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-1">AI Assigned Department</span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-white font-semibold">
                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] px-2 py-0.5 rounded font-semibold tracking-wide uppercase shrink-0">
                        {selectedDetail.departmentName}
                      </span>
                      {selectedDetail.departmentFullName && (
                        <span className="text-slate-300 text-[11px] font-semibold truncate max-w-[160px]">
                          {selectedDetail.departmentFullName}
                        </span>
                      )}
                    </div>
                    {selectedDetail.departmentDescription && (
                      <p className="text-[10px] text-slate-450 leading-normal mt-1.5 pt-1.5 border-t border-slate-800/40">
                        {selectedDetail.departmentDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Photo */}
              {selectedDetail.imageUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-700/50 bg-[#0a0f1a]">
                  <img 
                    src={selectedDetail.imageUrl} 
                    alt={selectedDetail.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl border border-dashed border-slate-700/50 bg-[#0a0f1a] flex flex-col items-center justify-center text-slate-550 gap-1">
                  <span className="text-xs font-semibold">No photo attached</span>
                </div>
              )}

              {/* Mini Map */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Geographic Location</span>
                <div 
                  ref={drawerMapRef} 
                  className="w-full h-44 rounded-xl overflow-hidden border border-slate-750 bg-[#0a0f1a]"
                ></div>
                <div className="flex items-center space-x-1 text-slate-400 text-xs font-semibold leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-emerald-450" />
                  <span className="truncate">{selectedDetail.townName}, {selectedDetail.districtName}</span>
                </div>
              </div>

              {/* Report Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Description</span>
                <p className="text-xs text-slate-350 leading-relaxed bg-[#0a0f1a] border border-slate-700/50 p-3 rounded-xl">
                  {selectedDetail.description || 'No description provided.'}
                </p>
              </div>

              {/* Citizen reporter & verifies */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Logged By</span>
                  <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-450" />
                    <span className="truncate">{selectedDetail.reporterName || 'Citizen'}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Confirms</span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedDetail.confirmCount} confirmations</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Audit History</span>
                {selectedDetail.statusHistories.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">No history records logged.</p>
                ) : (
                  <div className="relative border-l border-slate-700/50 pl-3 ml-1.5 space-y-4">
                    {selectedDetail.statusHistories.map((h, i) => (
                      <div key={i} className="relative text-[11px] leading-relaxed">
                        <div className="absolute -left-[18.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0a0f1a] border-2 border-emerald-500"></div>
                        <div className="space-y-0.5">
                          <p className="text-white font-semibold">
                            Transitioned to <span className={statusColors[h.newStatus] || 'text-white'}>{h.newStatus}</span>
                          </p>
                          <p className="text-slate-450">
                            By {h.changedByName} — <span className="italic text-slate-500">"{h.note}"</span>
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono">
                            {new Date(h.changedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-slate-500 text-xs italic">
              Report not found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;

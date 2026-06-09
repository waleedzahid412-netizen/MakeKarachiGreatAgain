import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { ReportDetail as ReportDetailType } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle,
  Clock,
  ChevronLeft,
  XOctagon,
  Wrench,
  AlertCircle
} from 'lucide-react';

const statusColors: Record<string, string> = {
  Reported: 'bg-red-500/10 text-red-400 border-red-500/20',
  Verified: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  InProgress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  Reported: <AlertCircle className="w-5 h-5 text-red-400" />,
  Verified: <CheckCircle className="w-5 h-5 text-blue-400" />,
  InProgress: <Wrench className="w-5 h-5 text-amber-400" />,
  Resolved: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  Rejected: <XOctagon className="w-5 h-5 text-slate-400" />,
};

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ text: string; success: boolean } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/reports/${id}`);
      setReport(res.data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.response?.data?.error || 'Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  // Leaflet map setup
  useEffect(() => {
    if (loading || !report || !mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        dragging: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([report.latitude, report.longitude], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      L.marker([report.latitude, report.longitude], { icon }).addTo(map);

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [loading, report]);

  const handleVerify = async (isConfirm: boolean) => {
    if (!report) return;
    setVerifyLoading(true);
    setVerifyMessage(null);

    try {
      const res = await axiosInstance.post(`/reports/${report.id}/verify`, {
        reportId: report.id,
        isConfirm,
      });

      if (res.data.success) {
        setVerifyMessage({
          text: isConfirm
            ? 'Thank you. You have confirmed the validity of this issue.'
            : 'Thank you. You have flagged this issue as fake or disputed.',
          success: true,
        });

        // Refresh details
        const detailsRes = await axiosInstance.get(`/reports/${report.id}`);
        setReport(detailsRes.data);
      } else {
        setVerifyMessage({
          text: res.data.errorMessage || 'Verification failed.',
          success: false,
        });
      }
    } catch (err: any) {
      setVerifyMessage({
        text: err.response?.data?.error || err.response?.data?.errorMessage || 'An error occurred during verification.',
        success: false,
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh] bg-[#0a0f1a]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-550"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh] bg-[#0a0f1a] p-4">
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-8 text-center max-w-md w-full shadow-2xl flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Report not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#0a0f1a] border border-slate-700/50 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a2332] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isReporter = report.reporterId === user?.userId;
  const isCitizen = user?.role === 'Citizen';
  const showVerificationSection = isCitizen;

  return (
    <div className="flex-grow bg-[#0a0f1a] text-slate-300 py-8 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-emerald-450 hover:text-emerald-350 text-sm font-semibold transition"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Go Back</span>
          </button>

          {report.isEmergency && (
            <span className="bg-red-500/10 text-red-400 border border-red-500/25 text-xs px-3.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse shadow shadow-red-950/20">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Emergency Alert
            </span>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Info, Details & History (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title Block */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider bg-[#0a0f1a] px-3 py-1 rounded-lg border border-slate-700/50">
                    {report.categoryName}
                  </span>
                  
                  {report.departmentName && (
                    <div className="relative group flex items-center">
                      <span className="bg-blue-500/10 text-blue-450 border border-blue-500/20 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-help flex items-center gap-1.5 shadow-sm">
                        <span>Assigned:</span>
                        <strong className="text-blue-300 font-semibold">{report.departmentFullName || report.departmentName}</strong>
                      </span>
                      
                      {/* Tooltip / hover description */}
                      {report.departmentDescription && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 w-64 bg-[#0a0f1a] text-slate-300 text-[11px] rounded-xl p-3 shadow-2xl border border-slate-700/50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-30 leading-normal">
                          <div className="font-semibold text-blue-400 mb-0.5">{report.departmentFullName || report.departmentName}</div>
                          {report.departmentDescription}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColors[report.statusName] || 'bg-[#0a0f1a] text-slate-350'}`}>
                  {report.statusName}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {report.title}
              </h1>

              {/* Meta information row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/60 pt-5 mt-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Reporter: <strong className="text-white font-medium">{report.reporterName}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Date: <strong className="text-white font-medium">{new Date(report.createdAt).toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Area: <strong className="text-white font-medium">{report.townName}, {report.districtName}</strong></span>
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-lg font-medium text-white">Report Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {report.description || 'No description was provided.'}
              </p>
            </div>

            {/* Status Timeline History Block */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-slate-850 pb-3">Status Timeline</h3>
              
              {report.statusHistories.length === 0 ? (
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 bg-[#0a0f1a] border border-slate-700/50 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Report Registered</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {new Date(report.createdAt).toLocaleString()} · System Init
                    </p>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                      Issue successfully filed by {report.reporterName} and pending review/confirmations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative border-l border-slate-700/50 ml-4 pl-6 space-y-6">
                  {/* Initial state */}
                  <div className="relative">
                    <div className="absolute -left-10 top-0.5 w-8 h-8 bg-[#0a0f1a] border border-slate-700/50 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Report Logged</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {new Date(report.createdAt).toLocaleString()} · Initial
                      </p>
                    </div>
                  </div>

                  {/* Transitions list */}
                  {report.statusHistories.map((h, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-10 top-0.5 w-8 h-8 bg-[#0a0f1a] border border-slate-700/50 rounded-full flex items-center justify-center">
                        {statusIcons[h.newStatus] || <Clock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Status updated to: <span className="text-emerald-450 font-medium">{h.newStatus}</span>
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {new Date(h.changedAt).toLocaleString()} · By {h.changedByName}
                        </p>
                        {h.note && (
                          <p className="text-slate-400 text-xs mt-1.5 bg-[#0a0f1a] p-3 rounded-lg border border-slate-700/50">
                            Note: "{h.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sidebar (Photo, Map, Verification) */}
          <div className="space-y-6">
            
            {/* Photo Attachment Card */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
              {report.imageUrl ? (
                <div className="w-full bg-[#0a0f1a] flex items-center justify-center max-h-[320px]">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-full object-cover max-h-[320px] hover:scale-102 transition duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-[#111827]/80 flex flex-col items-center justify-center text-slate-500 p-6">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">No Photo Attached</span>
                </div>
              )}
            </div>

            {/* Status Statistics Influence Card */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-white font-medium text-sm border-b border-slate-800 pb-2">Metrics</h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-[#0a0f1a] border border-slate-700/50 rounded-xl p-3.5 text-center">
                  <span className="block text-[10px] text-slate-550 font-bold uppercase tracking-wider mb-1">Priority</span>
                  <span className="text-2xl font-semibold text-emerald-450">{report.priorityScore}</span>
                </div>
                <div className="bg-[#0a0f1a] border border-slate-700/50 rounded-xl p-3.5 text-center">
                  <span className="block text-[10px] text-slate-550 font-bold uppercase tracking-wider mb-1">Confirmations</span>
                  <span className="text-2xl font-semibold text-emerald-450">{report.confirmCount}/3</span>
                </div>
              </div>
            </div>

            {/* Verification Vote Action Card */}
            {showVerificationSection && (
              <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-white font-medium text-sm border-b border-slate-805 pb-2">Community Verification</h3>

                {verifyMessage && (
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    verifyMessage.success
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-350'
                      : 'bg-red-950/20 border-red-500/30 text-red-300'
                  }`}>
                    {verifyMessage.text}
                  </div>
                )}

                {isReporter ? (
                  <div className="bg-[#0a0f1a] border border-slate-700/50 p-3.5 rounded-xl text-xs text-slate-500 leading-relaxed">
                    You are the author of this ticket. You cannot verify or dispute your own report.
                  </div>
                ) : report.hasVerified ? (
                  <div className="bg-[#0a0f1a] border border-emerald-500/20 p-3.5 rounded-xl text-xs text-emerald-400 font-semibold leading-relaxed text-center">
                    You have verified this ticket.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Confirm this issue if you have personally witnessed it, or dispute it if you think it is fake.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleVerify(true)}
                        disabled={verifyLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition active:scale-[0.98] shadow shadow-emerald-950/20"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleVerify(false)}
                        disabled={verifyLoading}
                        className="bg-[#0a0f1a] hover:bg-[#1a2332] disabled:opacity-50 text-slate-350 hover:text-white border border-slate-700/50 text-xs font-semibold py-2.5 px-3 rounded-xl transition active:scale-[0.98]"
                      >
                        Dispute
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Embedded Coordinate Map Pin Location */}
            <div className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden p-4 space-y-3 shadow-xl">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
              </div>
              <div
                ref={mapRef}
                className="w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-[#0a0f1a]"
              ></div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Placeholder icon mapping fallback
const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default ReportDetail;

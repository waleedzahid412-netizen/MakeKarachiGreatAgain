import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import type { ReportSummary, LookupItem } from '../types';
import { Filter, AlertOctagon } from 'lucide-react';

const statusColors: Record<string, string> = {
  Reported: '#ef4444',
  Verified: '#3b82f6',
  InProgress: '#f59e0b',
  Resolved: '#10b981',
  Rejected: '#6b7280',
};

const ReportMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterEmergency, setFilterEmergency] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, categoriesRes] = await Promise.all([
          axiosInstance.get('/reports'),
          axiosInstance.get('/lookups/categories'),
        ]);
        setReports(reportsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (filterStatus && r.statusName !== filterStatus) return false;
    if (filterCategory && r.categoryName !== filterCategory) return false;
    if (filterEmergency && !r.isEmergency) return false;
    return true;
  });

  // Initialize and update map
  useEffect(() => {
    if (!mapRef.current || loading) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Restrict map bounds to Karachi only: [24.75, 66.85] to [25.10, 67.20]
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

      // Clear existing markers
      if (markersLayerRef.current) {
        leafletMapRef.current.removeLayer(markersLayerRef.current);
      }

      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);

      filteredReports.forEach((r) => {
        const color = statusColors[r.statusName] || '#ef4444';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #0f172a;box-shadow:0 3px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">${
            r.isEmergency ? '<span style="width:5px;height:5px;border-radius:50%;background:white;animation:pulse 1s infinite;"></span>' : ''
          }</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([r.latitude, r.longitude], { icon });

        // Styled popup for dark aesthetic
        const popupContent = `
          <div style="font-family:system-ui, -apple-system, sans-serif;min-width:180px;color:#cbd5e1;padding:2px;">
            <h4 style="margin:0 0 4px;font-size:13px;font-weight:600;color:white;line-height:1.2;">${r.title}</h4>
            <p style="margin:0;font-size:11px;color:#94a3b8;">Category: ${r.categoryName}</p>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;color:white;background:${color};">
                ${r.statusName}
              </span>
              <a href="/reports/${r.id}" style="font-size:11px;color:#10b981;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;">
                View Details →
              </a>
            </div>
            ${r.imageUrl ? `<img src="${r.imageUrl}" style="width:100%;height:85px;object-fit:cover;border-radius:8px;margin-top:8px;border:1px solid rgba(51, 65, 85, 0.5);" />` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(markersLayerRef.current);
      });

      leafletMapRef.current.invalidateSize();
    };

    initMap();
  }, [filteredReports, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 w-full relative flex flex-col bg-[#0a0f1a] min-h-[calc(100vh-64px)] font-sans">
      
      {/* Map Element */}
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a] z-20">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-slate-400 text-xs font-semibold">Initializing Karachi Map...</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="absolute inset-0 w-full h-full z-0"></div>
      )}

      {/* Floating Filter Panel Card Overlay */}
      {!loading && (
        <div className="absolute top-4 left-4 z-[1000] w-72 bg-[#111827]/90 border border-slate-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white text-xs uppercase tracking-wider font-semibold">Filter Dashboard</h3>
          </div>

          <div className="space-y-3">
            {/* Status Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Emergency Toggle */}
            <div className="pt-1.5">
              <label className="flex items-center space-x-2 text-xs text-slate-350 cursor-pointer select-none bg-[#0a0f1a] p-2 rounded-lg border border-slate-700/50">
                <input
                  type="checkbox"
                  checked={filterEmergency}
                  onChange={(e) => setFilterEmergency(e.target.checked)}
                  className="rounded border-slate-700/50 bg-[#0a0f1a] text-red-500 focus:ring-red-500"
                />
                <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">Emergency Only</span>
              </label>
            </div>
          </div>

          {/* Counts */}
          <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-between border-t border-slate-800 pt-2">
            <span>TOTAL VISIBLE:</span>
            <span className="text-emerald-450 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              {filteredReports.length} ticket{filteredReports.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Legend Overlay bottom left */}
      {!loading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#111827]/90 border border-slate-700/50 rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-md flex items-center space-x-3 text-[10px] text-slate-450 font-semibold">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></div>
              <span>{status}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ReportMap;

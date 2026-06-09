import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { LookupItem } from '../types';
import { 
  MapPin, 
  Image as ImageIcon, 
  AlertOctagon, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader,
  Bot
} from 'lucide-react';

const STEPS = ['Category & Area', 'Description', 'Map Location', 'Attach Photo', 'Review & Submit'];

const CreateReport: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [assignedDepartment, setAssignedDepartment] = useState<string | null>(null);

  // Form state
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [districts, setDistricts] = useState<LookupItem[]>([]);
  const [towns, setTowns] = useState<LookupItem[]>([]);
  
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [townId, setTownId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number>(24.8607);
  const [longitude, setLongitude] = useState<number>(67.0011);
  const [mapClicked, setMapClicked] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [catRes, distRes] = await Promise.all([
          axiosInstance.get('/lookups/categories'),
          axiosInstance.get('/lookups/districts'),
        ]);
        setCategories(catRes.data);
        setDistricts(distRes.data);
      } catch (err) {
        console.error('Failed to load lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Load towns when district changes
  useEffect(() => {
    if (districtId === '') {
      setTowns([]);
      setTownId('');
      return;
    }
    const fetchTowns = async () => {
      try {
        const res = await axiosInstance.get(`/lookups/towns?districtId=${districtId}`);
        setTowns(res.data);
        setTownId('');
      } catch (err) {
        console.error('Failed to load towns:', err);
      }
    };
    fetchTowns();
  }, [districtId]);

  // Initialize map
  useEffect(() => {
    if (step !== 2 || !mapRef.current) return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      // Restrict to Karachi bounds: southWest: [24.75, 66.85], northEast: [25.10, 67.20]
      const southWest = L.latLng(24.75, 66.85);
      const northEast = L.latLng(25.10, 67.20);
      const karachiBounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: true,
        maxBounds: karachiBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 10
      }).setView([latitude, longitude], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Custom marker icon
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (mapClicked) {
        markerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        // Verify clicks are strictly inside Karachi
        if (karachiBounds.contains(e.latlng)) {
          setLatitude(lat);
          setLongitude(lng);
          setMapClicked(true);
          setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy.map;
            return copy;
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          }
        }
      });

      leafletMapRef.current = map;

      // Fix map rendering size
      setTimeout(() => map.invalidateSize(), 150);
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [step]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, image: 'Image must be under 5MB' }));
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.image;
        return copy;
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, image: 'Image must be under 5MB' }));
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.image;
        return copy;
      });
    }
  };

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (categoryId === '') errs.categoryId = 'Please select an issue category';
      if (districtId === '') errs.districtId = 'Please select district';
      if (townId === '') errs.townId = 'Please select town';
    } else if (step === 1) {
      if (!title.trim()) errs.title = 'Title is required';
      else if (title.length > 200) errs.title = 'Title cannot exceed 200 characters';

      if (!description.trim()) errs.description = 'Description is required';
      else if (description.length > 2000) errs.description = 'Description cannot exceed 2000 characters';
    } else if (step === 2) {
      if (!mapClicked) errs.map = 'You must pin the exact coordinates on the map';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('categoryId', String(categoryId));
    formData.append('title', title);
    formData.append('description', description);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('districtId', String(districtId));
    formData.append('townId', String(townId));
    formData.append('isEmergency', String(isEmergency));
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await axiosInstance.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const createdReport = res.data;
      if (createdReport && createdReport.departmentName) {
        setAssignedDepartment(createdReport.departmentName);
      }
      setSuccess(true);
      setTimeout(() => navigate('/reports/mine'), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const isModerationError = error ? error.includes('Report blocked by content moderation') : false;
  const moderationReason = isModerationError && error
    ? error.replace('Report blocked by content moderation:', '').trim()
    : '';

  if (success) {
    return (
      <div className="flex-grow bg-[#0a0f1a] flex items-center justify-center min-h-[80vh] font-sans">
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-8 text-center max-w-md w-full shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Report Submitted</h2>
          {assignedDepartment && (
            <div className="bg-[#0a0f1a] border border-emerald-500/20 rounded-xl p-4 my-4 w-full text-center">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">AI Routed Department</span>
              <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-lg">
                {assignedDepartment}
              </span>
            </div>
          )}
          <p className="text-slate-400 text-sm">Thank you. Redirecting to My Reports...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex-grow bg-[#0a0f1a] text-slate-300 py-8 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Report an Issue</h1>
          <p className="text-slate-400 text-sm mt-1">Submit civic complaints to your municipal town authorities.</p>
        </div>

        {/* Step progress indicators */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>STEP {step + 1} OF {STEPS.length} : {STEPS[step]}</span>
            <span className="text-emerald-450">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-[#0a0f1a] h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {error && (
          isModerationError ? (
            <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-2xl p-5 shadow-lg flex items-start space-x-3.5">
              <Bot className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-semibold text-red-400">Moderation Filter Flagged Content</h4>
                <p className="text-xs text-red-300 leading-relaxed">
                  Reason: "{moderationReason}"
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Please revise your report and remove any sensitive, offensive, or off-topic phrases.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4 flex items-center space-x-2.5">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )
        )}

        {/* Form content box */}
        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl min-h-[300px]">
          
          {/* Step 0: Lookups */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-slate-350 text-sm font-medium">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value !== '' ? Number(e.target.value) : '');
                    setFieldErrors(prev => { const c = {...prev}; delete c.categoryId; return c; });
                  }}
                  className={`w-full bg-[#0a0f1a] border text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all ${
                    fieldErrors.categoryId ? 'border-red-500/50' : 'border-slate-700/50'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {fieldErrors.categoryId && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.categoryId}</p>
                )}
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="block text-slate-350 text-sm font-medium">District *</label>
                <select
                  value={districtId}
                  onChange={(e) => {
                    setDistrictId(e.target.value !== '' ? Number(e.target.value) : '');
                    setFieldErrors(prev => { const c = {...prev}; delete c.districtId; return c; });
                  }}
                  className={`w-full bg-[#0a0f1a] border text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all ${
                    fieldErrors.districtId ? 'border-red-500/50' : 'border-slate-700/50'
                  }`}
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {fieldErrors.districtId && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.districtId}</p>
                )}
              </div>

              {/* Town */}
              <div className="space-y-2">
                <label className="block text-slate-350 text-sm font-medium">Town *</label>
                <select
                  value={townId}
                  onChange={(e) => {
                    setTownId(e.target.value !== '' ? Number(e.target.value) : '');
                    setFieldErrors(prev => { const c = {...prev}; delete c.townId; return c; });
                  }}
                  disabled={districtId === ''}
                  className={`w-full bg-[#0a0f1a] border text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    fieldErrors.townId ? 'border-red-500/50' : 'border-slate-700/50'
                  }`}
                >
                  <option value="">Select town</option>
                  {towns.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {fieldErrors.townId && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.townId}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-slate-350 text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFieldErrors(prev => { const c = {...prev}; delete c.title; return c; });
                  }}
                  maxLength={200}
                  className={`w-full bg-[#0a0f1a] border text-sm rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all ${
                    fieldErrors.title ? 'border-red-500/50' : 'border-slate-700/50'
                  }`}
                  placeholder="e.g., Block 5 Clifton sewage overflow"
                />
                <div className="flex justify-between text-[11px] text-slate-500 px-1">
                  <span>{fieldErrors.title && <span className="text-red-400">{fieldErrors.title}</span>}</span>
                  <span>{title.length}/200</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-slate-350 text-sm font-medium">Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors(prev => { const c = {...prev}; delete c.description; return c; });
                  }}
                  maxLength={2000}
                  rows={6}
                  className={`w-full bg-[#0a0f1a] border text-sm rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all resize-none ${
                    fieldErrors.description ? 'border-red-500/50' : 'border-slate-700/50'
                  }`}
                  placeholder="Provide any helpful landmarks or specifics so the cleanup crews can find the issue..."
                />
                <div className="flex justify-between text-[11px] text-slate-500 px-1">
                  <span>{fieldErrors.description && <span className="text-red-400">{fieldErrors.description}</span>}</span>
                  <span>{description.length}/2000</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Leaflet Map */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-slate-350 text-sm font-medium">Select Location *</label>
                <p className="text-slate-400 text-xs">Click inside Karachi boundary bounds to lock exact pin coordinates.</p>
              </div>
              
              <div
                ref={mapRef}
                className={`w-full h-80 sm:h-96 rounded-xl overflow-hidden border bg-[#0a0f1a] ${
                  fieldErrors.map ? 'border-red-500/50' : 'border-slate-700/50'
                }`}
              ></div>

              <div className="flex items-center justify-between px-1">
                {mapClicked ? (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Location selected: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs font-semibold">No location pinned yet</span>
                )}
                {fieldErrors.map && (
                  <span className="text-red-400 text-xs">{fieldErrors.map}</span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Photo Attachment */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-slate-350 text-sm font-medium">Attach Photo (Optional)</label>
              
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('photo-upload-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center hover:bg-[#1a2332]/50 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                  fieldErrors.image ? 'border-red-500/50' : 'border-slate-700/50'
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <img 
                      src={imagePreview} 
                      alt="Upload Preview" 
                      className="max-h-40 mx-auto rounded-lg object-contain border border-slate-700/50" 
                    />
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-xs font-semibold truncate max-w-xs mx-auto">{image?.name}</span>
                      <span className="text-slate-500 text-[10px]">{(image!.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold underline"
                    >
                      Delete Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-[#0a0f1a] rounded-xl flex items-center justify-center text-slate-500 mx-auto border border-slate-700/50">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-350 text-sm font-medium">Drag and drop your file here</p>
                      <p className="text-slate-500 text-xs mt-1">or click to browse from system (PNG, JPG max 5MB)</p>
                    </div>
                  </div>
                )}
                
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {fieldErrors.image && (
                <p className="text-red-400 text-xs px-1">{fieldErrors.image}</p>
              )}
            </div>
          )}

          {/* Step 4: Emergency & Submission */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Emergency Switch */}
              <div className="bg-[#0a0f1a] border border-slate-700/50 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-white font-medium text-sm flex items-center space-x-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Emergency Priority Alert</span>
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                    Check this option only if this issue represents a life-safety hazard, open live wire threat, or flash flood blockade.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsEmergency(!isEmergency)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 shrink-0 ${
                    isEmergency ? 'bg-red-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                      isEmergency ? 'translate-x-7.5' : 'translate-x-0.5'
                    }`}
                  ></span>
                </button>
              </div>

              {/* Review Panel */}
              <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-[#0a0f1a]">
                <div className="bg-[#111827] px-5 py-3 border-b border-slate-700/50">
                  <h3 className="text-white font-medium text-sm">Review Ticket Details</h3>
                </div>
                
                <div className="p-5 space-y-3.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-semibold uppercase">Category</span>
                    <span className="text-white font-semibold">{categories.find(c => c.id === categoryId)?.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-semibold uppercase">District / Area</span>
                    <span className="text-white font-semibold">{districts.find(d => d.id === districtId)?.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-semibold uppercase">Town</span>
                    <span className="text-white font-semibold">{towns.find(t => t.id === townId)?.name}</span>
                  </div>
                  <div className="flex justify-between items-start border-t border-slate-800/60 pt-3">
                    <span className="text-slate-500 font-semibold uppercase">Title</span>
                    <span className="text-white font-semibold truncate ml-4 max-w-xs">{title}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-semibold uppercase">Location Coordinates</span>
                    <span className="text-emerald-400 font-semibold font-mono">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-semibold uppercase">Emergency State</span>
                    <span className={isEmergency ? 'text-red-400 font-semibold' : 'text-slate-450'}>
                      {isEmergency ? 'Hazard Active' : 'Normal'}
                    </span>
                  </div>
                  {imagePreview && (
                    <div className="border-t border-slate-800/60 pt-3 flex items-center space-x-3">
                      <img src={imagePreview} alt="Thumbnail" className="w-10 h-10 object-cover rounded border border-slate-700/50" />
                      <span className="text-slate-400 text-[11px] truncate max-w-xs">{image?.name} attached</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Form controls buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0 || loading}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#111827] hover:bg-[#1a2332] text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition disabled:opacity-35 disabled:pointer-events-none border border-slate-700/50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CreateReport;

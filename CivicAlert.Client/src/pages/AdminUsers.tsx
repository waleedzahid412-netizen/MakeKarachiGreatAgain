import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { LookupItem } from '../types';
import { 
  Users, 
  UserPlus, 
  X, 
  Loader,
  AlertCircle
} from 'lucide-react';

interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  districtName: string;
  townName: string;
  departmentName?: string;
  isActive: boolean;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [districts, setDistricts] = useState<LookupItem[]>([]);
  const [towns, setTowns] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('DistrictAdmin');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedTownId, setSelectedTownId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get<AdminUser[]>('/admin/users');
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load admin users:', err);
      setError(err.response?.data?.error || 'Failed to load administrative users database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Load districts for form dropdown
    const loadDistricts = async () => {
      try {
        const res = await axiosInstance.get<LookupItem[]>('/lookups/districts');
        setDistricts(res.data);
      } catch (err) {
        console.error('Failed to load districts lookup:', err);
      }
    };

    // Load departments for form dropdown
    const loadDepartments = async () => {
      try {
        const res = await axiosInstance.get<LookupItem[]>('/lookups/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments lookup:', err);
      }
    };

    loadDistricts();
    loadDepartments();
  }, [user]);

  // Load towns when selectedDistrictId changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setTowns([]);
      setSelectedTownId('');
      return;
    }

    const loadTowns = async () => {
      try {
        const res = await axiosInstance.get<LookupItem[]>(`/lookups/towns?districtId=${selectedDistrictId}`);
        setTowns(res.data);
        setSelectedTownId(''); // reset town selection
      } catch (err) {
        console.error('Failed to load towns lookup:', err);
      }
    };
    loadTowns();
  }, [selectedDistrictId]);

  const handleToggleStatus = async (userId: number) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/toggle-status`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: res.data.isActive } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle status.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const payload = {
      fullName,
      email,
      password,
      role,
      districtId: role !== 'DepartmentAdmin' && selectedDistrictId ? parseInt(selectedDistrictId) : null,
      townId: role === 'TownAdmin' && selectedTownId ? parseInt(selectedTownId) : null,
      departmentId: role === 'DepartmentAdmin' && selectedDepartmentId ? parseInt(selectedDepartmentId) : null
    };

    try {
      await axiosInstance.post('/admin/users', payload);
      setShowAddModal(false);
      
      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('DistrictAdmin');
      setSelectedDistrictId('');
      setSelectedTownId('');
      setSelectedDepartmentId('');

      // Refresh table
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      setModalError(err.response?.data?.error || 'Failed to create administrative account.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[75vh] bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold">Loading Admin Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto relative p-4 sm:p-0 font-sans text-slate-350 bg-[#0a0f1a]">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/50 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Manage Administrative Users</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            SuperAdmin panel to create and toggle active states of scope administrators.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition active:scale-95 shadow shadow-emerald-950/20 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin Account</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0f1a] border-b border-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">District</th>
                <th className="py-4 px-5">Town</th>
                <th className="py-4 px-5">Department</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Toggle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1a2332]/30 transition">
                  <td className="py-4 px-5 font-semibold text-white">{u.fullName}</td>
                  <td className="py-4 px-5 text-slate-400">{u.email}</td>
                  <td className="py-4 px-5">
                    <span className="bg-[#0a0f1a] text-slate-400 border border-slate-700/50 text-[9px] px-2 py-0.5 rounded font-semibold uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-450">{u.districtName || '-'}</td>
                  <td className="py-4 px-5 text-slate-450">{u.townName || '-'}</td>
                  <td className="py-4 px-5 text-slate-450">{u.departmentName || '-'}</td>
                  <td className="py-4 px-5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                      u.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      disabled={user?.userId === u.id} // cannot deactivate self
                      className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition ${
                        u.isActive
                          ? 'border-red-500/30 text-red-400 hover:bg-red-650 hover:text-white'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                      } disabled:opacity-30 disabled:pointer-events-none`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0f1a]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700/50 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-[#0a0f1a]/60">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-450" />
                <h3 className="text-white font-semibold text-sm">Create New Admin Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2332] transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
              {modalError && (
                <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Ahmed"
                  className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@civicalert.pk"
                  className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setSelectedDistrictId('');
                    setSelectedTownId('');
                    setSelectedDepartmentId('');
                  }}
                  className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="DistrictAdmin">District Admin</option>
                  <option value="TownAdmin">Town Admin</option>
                  <option value="DepartmentAdmin">Department Admin</option>
                </select>
              </div>

              {/* Scope selectors: District */}
              {(role === 'DistrictAdmin' || role === 'TownAdmin') && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Assigned District</label>
                  <select
                    required
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select District...</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope selectors: Town (if TownAdmin) */}
              {role === 'TownAdmin' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Assigned Town</label>
                  <select
                    required
                    value={selectedTownId}
                    onChange={(e) => setSelectedTownId(e.target.value)}
                    disabled={!selectedDistrictId}
                    className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                  >
                    <option value="">Select Town...</option>
                    {towns.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope selectors: Department (if DepartmentAdmin) */}
              {role === 'DepartmentAdmin' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Assigned Department</label>
                  <select
                    required
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full bg-[#0a0f1a] border border-slate-700/50 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/60 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold px-4 py-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition active:scale-95 flex items-center space-x-1.5 shadow shadow-emerald-950/20"
                >
                  {modalLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import type { LookupItem } from '../../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  Users, 
  Globe, 
  LogOut,
  Shield
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scopeName, setScopeName] = useState<string>('Loading scope...');

  useEffect(() => {
    if (!user || (user.role !== 'SuperAdmin' && user.role !== 'DistrictAdmin' && user.role !== 'TownAdmin' && user.role !== 'DepartmentAdmin')) {
      navigate('/login');
      return;
    }

    const resolveScope = async () => {
      try {
        if (user.role === 'SuperAdmin') {
          setScopeName('All Karachi');
        } else if (user.role === 'DepartmentAdmin') {
          setScopeName(`${user.departmentName} (City-Wide)`);
        } else if (user.role === 'DistrictAdmin' && user.districtId) {
          const distsRes = await axiosInstance.get('/lookups/districts');
          const dist = distsRes.data.find((d: LookupItem) => d.id === user.districtId);
          setScopeName(dist ? dist.name : `District #${user.districtId}`);
        } else if (user.role === 'TownAdmin' && user.districtId && user.townId) {
          const distsRes = await axiosInstance.get('/lookups/districts');
          const dist = distsRes.data.find((d: LookupItem) => d.id === user.districtId);
          const townsRes = await axiosInstance.get(`/lookups/towns?districtId=${user.districtId}`);
          const t = townsRes.data.find((x: LookupItem) => x.id === user.townId);
          setScopeName(t ? `${t.name} (${dist ? dist.name : ''})` : `Town #${user.townId}`);
        }
      } catch (err) {
        console.error('Failed to resolve scope name:', err);
        setScopeName('Unknown Scope');
      }
    };

    resolveScope();
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/emergency', label: 'Emergency Center', icon: AlertTriangle },
  ];

  if (user.role === 'SuperAdmin') {
    navLinks.push({ to: '/admin/users', label: 'Manage Users', icon: Users });
  }

  // Active check helper
  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-slate-100 overflow-hidden font-sans w-full">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0a0f1a] border-r border-slate-700/50 flex flex-col justify-between h-full shrink-0">
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
            {user.role === 'DepartmentAdmin' ? (
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white text-sm tracking-tight">{user.departmentName} Dashboard</span>
              </div>
            ) : (
              <>
                <Link to="/admin/overview" className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-450" />
                  <span className="font-semibold text-white text-base tracking-tight">CivicAlert</span>
                </Link>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Admin
                </span>
              </>
            )}
          </div>

          {/* Profile Details */}
          <div className="p-4 border-b border-slate-700/50 flex items-center space-x-2.5 bg-slate-900/10">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-white text-xs font-semibold truncate leading-tight">{user.fullName}</h4>
              <span className="text-slate-400 text-[8px] uppercase font-bold tracking-widest mt-0.5">
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-emerald-600/10 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3 inline shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Public Transparency Page link */}
            <Link
              to="/transparency"
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
            >
              <Globe className="w-4 h-4 mr-3 inline shrink-0" />
              <span>Transparency</span>
            </Link>
          </nav>
        </div>

        {/* Logout bottom */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#0a0f1a] p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

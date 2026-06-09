import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSignalR } from '../../hooks/useSignalR';
import { 
  LayoutDashboard, 
  FileWarning, 
  ClipboardList, 
  Map, 
  LogOut, 
  Globe, 
  User, 
  Lock,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllAsRead } = useSignalR();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'DistrictAdmin' || user?.role === 'TownAdmin' || user?.role === 'DepartmentAdmin';

  const linkClass = (path: string) =>
    `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
      isActive(path)
        ? 'text-white bg-slate-800 border-slate-700'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border-transparent hover:border-slate-800'
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
      isActive(path)
        ? 'text-white bg-slate-800 border-slate-700 font-semibold shadow-sm'
        : 'text-slate-400 hover:text-white border-transparent'
    }`;

  return (
    <nav className="w-full bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 h-16">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 mt-0.5">
          {/* Left: Brand/Logo */}
          <Link to={isAdmin ? "/admin/overview" : "/dashboard"} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/10">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-lg leading-tight">CivicAlert</span>
              <span className="text-emerald-450 text-xs font-semibold uppercase tracking-widest leading-none">Karachi</span>
            </div>
          </Link>

          {/* Center: Navigation - Role-Based Links */}
          <div className="hidden md:flex items-center space-x-1">
            {!user ? (
              // Anonymous Guest Navigation
              <>
                <Link to="/transparency" className={linkClass('/transparency')}>
                  <Globe className="w-4 h-4" />
                  <span>Transparency</span>
                </Link>
                <Link to="/help" className={linkClass('/help')}>
                  <HelpCircle className="w-4 h-4" />
                  <span>Help & Support</span>
                </Link>
              </>
            ) : !isAdmin ? (
              // Citizen Navigation
              <>
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/reports/create" className={linkClass('/reports/create')}>
                  <FileWarning className="w-4 h-4" />
                  <span>Report Issue</span>
                </Link>
                <Link to="/reports/mine" className={linkClass('/reports/mine')}>
                  <ClipboardList className="w-4 h-4" />
                  <span>My Reports</span>
                </Link>
                <Link to="/reports/map" className={linkClass('/reports/map')}>
                  <Map className="w-4 h-4" />
                  <span>Map</span>
                </Link>
                <Link to="/transparency" className={linkClass('/transparency')}>
                  <Globe className="w-4 h-4" />
                  <span>Transparency</span>
                </Link>
                <Link to="/help" className={linkClass('/help')}>
                  <HelpCircle className="w-4 h-4" />
                  <span>Help</span>
                </Link>
              </>
            ) : (
              // Admin Navigation
              <>
                <Link to="/admin/overview" className={linkClass('/admin/overview')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
                <Link to="/reports/map" className={linkClass('/reports/map')}>
                  <Map className="w-4 h-4" />
                  <span>Map</span>
                </Link>
                <Link to="/transparency" className={linkClass('/transparency')}>
                  <Globe className="w-4 h-4" />
                  <span>Transparency</span>
                </Link>
                <Link to="/help" className={linkClass('/help')}>
                  <HelpCircle className="w-4 h-4" />
                  <span>Help</span>
                </Link>
              </>
            )}
          </div>

          {/* Right: Notifications + User + Language + Logout */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden text-xs">
                    <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-white font-extrabold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllAsRead();
                            setShowNotifications(false);
                          }}
                          className="text-emerald-400 hover:text-emerald-350 font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 italic">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const timeAgo = formatTimeAgo(n.createdAt);
                          return (
                            <div 
                              key={n.id || Math.random()} 
                              className={`px-4 py-3 flex gap-2.5 items-start hover:bg-slate-800/20 transition ${
                                !n.isRead ? 'bg-slate-800/10' : ''
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {n.type === 'Emergency' ? (
                                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                ) : n.type === 'StatusChanged' ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Info className="w-4 h-4 text-blue-400" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className={`font-semibold leading-normal ${!n.isRead ? 'text-white' : 'text-slate-350'}`}>
                                  {n.message}
                                </p>
                                <span className="text-[9px] text-slate-500 font-mono block">
                                  {timeAgo}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User identity info badge */}
            {user && (
              <div className="hidden lg:flex items-center space-x-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl px-2.5 py-1">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex flex-col items-start text-[11px] leading-tight">
                  <span className="text-white font-semibold">{user.fullName}</span>
                  <span className="text-slate-400 text-[8px] uppercase tracking-widest font-bold">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden p-0.5 shadow-inner">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                  i18n.language === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('ur')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                  i18n.language === 'ur'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                اردو
              </button>
            </div>

            {/* Logout/Login Button */}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow shadow-emerald-950/15"
              >
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex flex-wrap items-center justify-center gap-1 pb-3 border-t border-slate-800/50 pt-2">
          {!user ? (
            <>
              <Link to="/transparency" className={mobileLinkClass('/transparency')}>
                <Globe className="w-3.5 h-3.5" />
                <span>Transparency</span>
              </Link>
              <Link to="/help" className={mobileLinkClass('/help')}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </Link>
            </>
          ) : !isAdmin ? (
            <>
              <Link to="/dashboard" className={mobileLinkClass('/dashboard')}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/reports/create" className={mobileLinkClass('/reports/create')}>
                <FileWarning className="w-3.5 h-3.5" />
                <span>Report</span>
              </Link>
              <Link to="/reports/mine" className={mobileLinkClass('/reports/mine')}>
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Mine</span>
              </Link>
              <Link to="/reports/map" className={mobileLinkClass('/reports/map')}>
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </Link>
              <Link to="/transparency" className={mobileLinkClass('/transparency')}>
                <Globe className="w-3.5 h-3.5" />
                <span>Transparency</span>
              </Link>
              <Link to="/help" className={mobileLinkClass('/help')}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/admin/overview" className={mobileLinkClass('/admin/overview')}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <Link to="/reports/map" className={mobileLinkClass('/reports/map')}>
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </Link>
              <Link to="/transparency" className={mobileLinkClass('/transparency')}>
                <Globe className="w-3.5 h-3.5" />
                <span>Transparency</span>
              </Link>
              <Link to="/help" className={mobileLinkClass('/help')}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

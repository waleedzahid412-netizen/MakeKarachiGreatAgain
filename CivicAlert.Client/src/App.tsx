import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateReport from './pages/CreateReport';
import MyReports from './pages/MyReports';
import ReportMap from './pages/ReportMap';
import ReportDetail from './pages/ReportDetail';
import Navbar from './components/Layout/Navbar';
import AdminLayout from './components/Layout/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminReports from './pages/AdminReports';
import AdminEmergency from './pages/AdminEmergency';
import AdminUsers from './pages/AdminUsers';
import Transparency from './pages/Transparency';
import ChatBot from './pages/ChatBot';
import Landing from './pages/Landing';

// Protected Route Wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-955">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      if (user?.role === 'Citizen') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/admin/overview" replace />;
      }
    }
  }

  return <>{children}</>;
};

// Public Route Wrapper (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const adminRoles = ["SuperAdmin", "DistrictAdmin", "TownAdmin", "DepartmentAdmin"];
    if (adminRoles.includes(user?.role || "")) {
      return <Navigate to="/admin/overview" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Layout with Navbar for authenticated pages
const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-955">
      <Navbar />
      <Outlet />
    </div>
  );
};

// Root Redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const adminRoles = ["SuperAdmin", "DistrictAdmin", "TownAdmin", "DepartmentAdmin"];
  if (adminRoles.includes(user?.role || "")) {
    return <Navigate to="/admin/overview" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

// Root Route (renders Landing page if guest, redirects if authenticated)
const RootRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <RootRedirect /> : <Landing />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public transparency dashboard */}
          <Route path="/transparency" element={<Transparency />} />

          {/* Public routes with Navbar layout */}
          <Route
            element={
              <div className="min-h-screen bg-slate-950">
                <Navbar />
                <Outlet />
              </div>
            }
          >
            <Route path="/help" element={<ChatBot />} />
          </Route>

          {/* Public auth routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes with Navbar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/reports/create"
              element={
                <ProtectedRoute allowedRoles={["Citizen"]}>
                  <CreateReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/mine"
              element={
                <ProtectedRoute allowedRoles={["Citizen"]}>
                  <MyReports />
                </ProtectedRoute>
              }
            />
            <Route path="/reports/map" element={<ReportMap />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
          </Route>

          {/* Admin routes with fixed sidebar layout wrapper */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "DistrictAdmin", "TownAdmin", "DepartmentAdmin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="emergency" element={<AdminEmergency />} />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<RootRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { User, Mail, Lock, Phone } from 'lucide-react';

const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', {
        fullName,
        email,
        password,
        phoneNumber: phoneNumber || null,
        districtId: null, // Registering as Citizen defaults to null
        townId: null,     // Registering as Citizen defaults to null
      });

      if (response.data && response.data.success) {
        await login({
          userId: response.data.userId,
          email: response.data.email,
          role: response.data.role,
          districtId: response.data.districtId,
          townId: response.data.townId,
          fullName: response.data.fullName,
          preferredLanguage: response.data.preferredLanguage,
          departmentId: response.data.departmentId,
          departmentName: response.data.departmentName,
          departmentFullName: response.data.departmentFullName,
          departmentDescription: response.data.departmentDescription,
        });
        
        const data = response.data;
        const adminRoles = ["SuperAdmin", "DistrictAdmin", "TownAdmin", "DepartmentAdmin"];
        if (adminRoles.includes(data.role || "")) {
          navigate("/admin/overview", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setError(response.data.errorMessage || 'Registration failed');
      }
    } catch (err: any) {
      if (err.response?.data?.errorMessage) {
        setError(err.response.data.errorMessage);
      } else if (err.response?.data?.errors) {
        // Validation errors
        const validationErrors = err.response.data.errors;
        const messages = Object.values(validationErrors).flat().join(' ');
        setError(messages);
      } else {
        setError('Something went wrong during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0f1a] p-4 font-sans text-slate-300 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 flex space-x-2 z-20">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
            i18n.language === 'en'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-[#111827] text-slate-400 border-slate-700/50 hover:text-white'
          }`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ur')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
            i18n.language === 'ur'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-[#111827] text-slate-400 border-slate-700/50 hover:text-white'
          }`}
        >
          اردو
        </button>
      </div>

      <div className="w-full max-w-md bg-[#111827] border border-slate-700/50 rounded-2xl p-8 shadow-2xl transition-all duration-500 hover:border-emerald-500/30 my-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
            {t('createAccount')}
          </h2>
          <p className="text-slate-400 text-sm">CivicAlert Karachi</p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-sm rounded-lg p-3 mb-6 flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="fullName">
              {t('fullName')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-300 text-sm"
                placeholder="Ali Khan"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="email">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-300 text-sm"
                placeholder="ali@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="password">
              {t('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-300 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="phoneNumber">
              {t('phoneNumber')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#0a0f1a] border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-300 text-sm"
                placeholder="03001234567"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            {loading ? (
              <span className="flex justify-center items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('submit')}...
              </span>
            ) : (
              t('register')
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span>{t('haveAccount')} </span>
          <Link
            to="/login"
            className="text-emerald-400 font-semibold hover:text-emerald-350 underline transition-colors duration-200"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

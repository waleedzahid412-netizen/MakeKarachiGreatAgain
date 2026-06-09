import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  MapPin, 
  Users, 
  CheckCircle, 
  Shield, 
  Brain, 
  Globe, 
  BarChart, 
  Bell, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface StatsMetrics {
  totalReports: number;
  resolvedCount: number;
  resolutionRate: number;
}

const Landing: React.FC = () => {
  const [stats, setStats] = useState<StatsMetrics>({
    totalReports: 0,
    resolvedCount: 0,
    resolutionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/public/transparency');
        setStats({
          totalReports: res.data.totalReports || 0,
          resolvedCount: res.data.resolvedCount || 0,
          resolutionRate: res.data.resolutionRate || 0
        });
      } catch (err) {
        console.error('Failed to load landing stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex flex-col justify-between font-sans">
      {/* Landing Navbar */}
      <header className="w-full h-16 border-b border-slate-700/30 bg-[#0a0f1a]/80 backdrop-blur-xl fixed top-0 left-0 z-50 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/10">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm leading-tight">CivicAlert</span>
            <span className="text-emerald-450 text-[10px] uppercase tracking-widest font-semibold">Karachi</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <Link 
            to="/transparency" 
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/help" 
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
          >
            Help Center
          </Link>
          <Link 
            to="/login" 
            className="text-xs text-slate-300 hover:text-white font-semibold transition-colors bg-transparent border border-slate-800 hover:border-slate-600 rounded-lg px-3 py-1.5"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="text-xs text-white font-semibold transition-colors bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 shadow shadow-emerald-950/20"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden bg-gradient-to-br from-emerald-950/20 via-[#0a0f1a] to-[#0a0f1a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(255,255,255,0))] pointer-events-none"></div>
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>ZABEFEST Hackathon 2026 Project</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight uppercase">
            Make Karachi <span className="text-emerald-400">Great Again</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CivicAlert is an advanced civic engagement and transparency platform. Report local infrastructure issues—such as sewage leakages, waste dumping, road potholes, and power hazards—which are automatically routed to the responsible departments like KWSB, SSWMB, KMC, and K-Electric.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg px-6 py-3 transition-colors shadow shadow-emerald-950/20 flex items-center justify-center space-x-2"
            >
              <span>Sign Up / Register</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-350 font-medium text-sm rounded-lg px-6 py-3 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Login to Portal</span>
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Login</Link>
          </p>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/40 bg-[#0c1322]/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-white">How CivicAlert Works</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Empowering citizens to route issues to municipal departments in three steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-[#111827] border border-slate-700/50 p-6 rounded-xl space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">1. Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop a pin on the map and describe the issue. Upload a photo as evidence for quick department matching.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111827] border border-slate-700/50 p-6 rounded-xl space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">2. Verify</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Other citizens confirm the report locally. Reaching 3 community confirmations promotes the ticket to verified status.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111827] border border-slate-700/50 p-6 rounded-xl space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">3. Resolve</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Municipal departments (KWSB, SSWMB, etc.) receive the routing notification and initiate physical work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/40">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-white">Built for Karachi</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Equipped with modern AI systems and transparency tools to address civic issues at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <Shield className="w-8 h-8 text-emerald-500" />
              <h4 className="text-sm font-semibold text-white">AI-Powered Moderation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every report description is screened for authenticity and prompt injection to filter false claims.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <Brain className="w-8 h-8 text-blue-500" />
              <h4 className="text-sm font-semibold text-white">Smart Department Routing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI classifies and routes complaints to the correct department (e.g. KWSB, SSWMB, K-Electric) based on report content.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <Globe className="w-8 h-8 text-purple-500" />
              <h4 className="text-sm font-semibold text-white">Bilingual Support</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full English and Urdu translations across the platform to ensure accessibility for all citizens.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <BarChart className="w-8 h-8 text-amber-500" />
              <h4 className="text-sm font-semibold text-white">Public Transparency</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time dashboard displays resolution rates, category charts, and historic audits publicly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <Bell className="w-8 h-8 text-rose-500" />
              <h4 className="text-sm font-semibold text-white">Real-Time Alerts</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immediate email updates and browser alerts notify you at every stage of the report workflow.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-xl space-y-3 hover:border-slate-600/50 transition-colors">
              <MapPin className="w-8 h-8 text-sky-500" />
              <h4 className="text-sm font-semibold text-white">Geo-Tagged Reports</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual interactive maps detail reports, status classifications, and density profiles across neighborhoods.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/40 bg-[#0c1322]/40">
        <div className="max-w-4xl mx-auto bg-[#111827] border border-slate-700/50 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-around items-center gap-8 shadow-xl">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Reports Filed</span>
            <span className="text-3xl font-extrabold text-emerald-450">
              {loading ? '...' : stats.totalReports}
            </span>
          </div>
          <div className="h-px w-full md:w-px md:h-12 bg-slate-850"></div>
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Issues Resolved</span>
            <span className="text-3xl font-extrabold text-emerald-455">
              {loading ? '...' : stats.resolvedCount}
            </span>
          </div>
          <div className="h-px w-full md:w-px md:h-12 bg-slate-850"></div>
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Resolution Rate</span>
            <span className="text-3xl font-extrabold text-emerald-450 flex items-center justify-center">
              {loading ? '...' : `${stats.resolutionRate}%`}
              <TrendingUp className="w-4 h-4 ml-1.5 text-emerald-400" />
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800/40 bg-[#070b13] text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-slate-350 font-bold">CivicAlert Karachi - Building a Better City Together</p>
            <p className="text-[10px] text-slate-505 font-medium uppercase tracking-wider">A ZABEFEST Hackathon 2026 Project</p>
          </div>
          
          <div className="flex items-center space-x-6 font-semibold">
            <Link to="/transparency" className="hover:text-white transition-colors">Transparency Dashboard</Link>
            <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

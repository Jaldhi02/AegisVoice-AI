import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Bell, User, LogOut, Menu, X, UploadCloud, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { checkMockMode } from "../services/mockData";

const Navbar = ({ onMobileMenuToggle, isMobileMenuOpen, alertCount = 0 }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMock, setIsMock] = useState(() => checkMockMode());

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMockMode = () => {
    const nextMode = !isMock;
    setIsMock(nextMode);
    localStorage.setItem("aegis_mock_mode", String(nextMode));
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 group-hover:border-cyan-400 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
                AegisVoice <span className="text-cyan-600">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                Voice Fraud Prevention
              </span>
            </div>
          </Link>
        </div>

        {/* Center: System Status Telemetry */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-medium">Neural Engine:</span>
            <span className="text-emerald-700 font-mono text-[11px] font-semibold">ACTIVE SCANNING</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-semibold font-mono">
            <span>🇮🇳 India Cyber Helpline:</span>
            <span className="text-cyan-900 font-bold">1930</span>
          </div>
        </div>

        {/* Right: Actions, Alerts, User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <>
              {/* Quick Upload action */}
              <Link
                to="/analysis"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Call</span>
              </Link>

              {/* Alerts bell */}
              <Link
                to="/alerts"
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="View High-Risk Threat Alerts"
              >
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white leading-none">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </Link>

              {/* User Avatar */}
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                title="Account & Settings"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-semibold text-xs">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />)}
                </div>
                <span className="hidden md:block text-xs font-medium text-slate-800 max-w-[100px] truncate">
                  {user?.full_name || user?.email || "Security Analyst"}
                </span>
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
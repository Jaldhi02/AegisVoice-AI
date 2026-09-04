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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
                AegisVoice <span className="text-cyan-400">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Voice Fraud Prevention
              </span>
            </div>
          </Link>
        </div>

        {/* Center: System Status Telemetry & Mock Mode Toggle */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Neural Engine:</span>
            <span className="text-emerald-400 font-mono text-[11px]">ACTIVE SCANNING</span>
          </div>

          {/* Interactive Mock Mode Switch */}
          <button
            type="button"
            onClick={toggleMockMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
              isMock
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10 hover:bg-amber-500/25"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle between Mock Data Mode and Live Backend Server API"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="font-mono font-medium text-[11px]">Mock Mode:</span>
            <span className={`font-bold font-mono text-[11px] ${isMock ? "text-amber-400" : "text-slate-400"}`}>
              {isMock ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Right: Actions, Alerts, User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <>
              {/* Quick Upload action */}
              <Link
                to="/analysis"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm shadow-cyan-500/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Call</span>
              </Link>

              {/* Alerts bell */}
              <Link
                to="/alerts"
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
                title="View High-Risk Threat Alerts"
              >
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </Link>

              {/* User Avatar */}
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 transition-colors text-slate-300"
                title="Account & Settings"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-semibold text-xs">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />)}
                </div>
                <span className="hidden md:block text-xs font-medium text-slate-200 max-w-[100px] truncate">
                  {user?.full_name || user?.email || "Security Analyst"}
                </span>
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
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
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
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
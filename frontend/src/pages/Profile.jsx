import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Key,
  Server,
  LogOut,
  RefreshCw,
  CheckCircle,
  Mail,
  Calendar,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getMe();
      setProfileData(data);
      setSuccess("Profile information synchronized with GET /api/auth/me");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Could not retrieve user profile from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileData) {
      fetchProfile();
    }
  }, []);

  const token = authService.getToken();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Analyst Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authenticated identity, access authorizations, and backend API telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync /api/auth/me</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Profile Sync Error"
          message={error}
          onRetry={fetchProfile}
          onDismiss={() => setError(null)}
        />
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {success}
          </span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-xs text-emerald-700 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="cyber-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 shrink-0">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-sky-700 text-3xl font-bold font-mono">
              {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : (profileData?.email ? profileData.email.charAt(0).toUpperCase() : "A")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {profileData?.full_name || profileData?.name || "Cybersecurity Analyst"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
                {profileData?.role || "SOC Tier-2 Forensic Specialist"}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 font-mono">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profileData?.email || "analyst@aegisvoice.internal"}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Identity Registered: {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "Active Clearance"}</span>
            </div>
          </div>
        </div>

        {/* Credentials & Access Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>Access Clearance & Privileges</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized to upload audio feeds, invoke full neural forensic models (<code className="text-sky-700 font-mono font-semibold">/api/analysis/full</code>), and export threat incidents.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>High-Risk Triage Allowed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <Key className="w-4 h-4 text-sky-600" />
              <span>Active JWT Token Session</span>
            </div>
            <p className="text-xs text-slate-600 font-mono break-all line-clamp-2">
              {token ? `${token.slice(0, 30)}...${token.slice(-15)}` : "No bearer token currently loaded."}
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Authorization Bearer Attached</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend API Contract Configuration */}
      <div className="cyber-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Backend Integration Gateway
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            FASTAPI CONFIGURED
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 gap-2">
            <span className="text-slate-600 font-medium">Target Base API URL:</span>
            <span className="font-mono text-sky-800 font-semibold">{apiBaseUrl}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="text-slate-700 font-semibold uppercase tracking-wider text-[11px] block">
              Contract Endpoints Active:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-600">
              <div>• POST /api/auth/login</div>
              <div>• POST /api/auth/register</div>
              <div>• GET /api/auth/me</div>
              <div>• POST /api/calls/upload</div>
              <div>• GET /api/calls</div>
              <div>• GET /api/calls/&#123;id&#125;</div>
              <div>• POST /api/analysis/full</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
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
      setSuccess("Profile information synchronized successfully.");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Could not retrieve user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileData) {
      fetchProfile();
    }
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Analyst Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Authenticated identity and access authorizations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Profile</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-sm"
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
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {success}
          </span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-xs text-emerald-700 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="cyber-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-cyan-600 text-3xl font-bold font-mono border border-cyan-100">
              {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : (profileData?.email ? profileData.email.charAt(0).toUpperCase() : "A")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {profileData?.full_name || profileData?.name || "Cybersecurity Analyst"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
                {profileData?.role || "SOC Tier-2 Forensic Specialist"}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 font-mono">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profileData?.email || "analyst@aegisvoice.internal"}</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Identity Registered: {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "Active Clearance"}</span>
            </div>
          </div>
        </div>

        {/* Credentials & Access Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Shield className="w-4 h-4 text-cyan-600" />
              <span>Access Clearance & Privileges</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Authorized to upload audio feeds, invoke full neural forensic models, and export threat incidents.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>High-Risk Triage Allowed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Key className="w-4 h-4 text-cyan-600" />
              <span>Security Session & Encryption</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Active encrypted session with 256-bit security protocol.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure Analyst Authentication Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
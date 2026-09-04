import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  Activity,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  RefreshCw,
  FileAudio,
} from "lucide-react";
import callService from "../services/callService";
import RiskScore from "../components/RiskScore";
import RiskBadge from "../components/RiskBadge";
import CallCard from "../components/CallCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [callerInput, setCallerInput] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callService.getCalls();
      const callList = Array.isArray(data) ? data : (data?.calls || []);
      setCalls(callList);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load call telemetry from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalScanned = calls.length;
  const fraudCalls = calls.filter((c) => {
    const score = c.risk_score ?? c.score ?? 0;
    return score >= 60 || c.status === "fraud" || c.is_synthetic;
  });
  const safeCalls = calls.filter((c) => {
    const score = c.risk_score ?? c.score ?? 0;
    return score < 35 && !c.is_synthetic;
  });

  const avgRiskScore = totalScanned > 0
    ? Math.round(
        calls.reduce((acc, c) => acc + (c.risk_score ?? c.score ?? 0), 0) / totalScanned
      )
    : 0;

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (callerInput) {
      formData.append("caller_number", callerInput);
    }

    try {
      await callService.uploadCall(formData, (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadSuccess("Audio call successfully uploaded for neural deepfake scanning!");
      setCallerInput("");
      fetchDashboardData();
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Threat Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time acoustic neural classification & linguistic scam forensics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Call</span>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Telemetry Synchronization Issue"
          message={error}
          onRetry={fetchDashboardData}
          onDismiss={() => setError(null)}
        />
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between">
          <span>{uploadSuccess}</span>
          <button
            type="button"
            onClick={() => setUploadSuccess(null)}
            className="text-xs text-emerald-400 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Calls */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Calls Scanned
            </span>
            <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700/50">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{totalScanned}</span>
            <span className="text-xs text-slate-400">total records</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400 gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Continuous neural monitoring</span>
          </div>
        </div>

        {/* Metric 2: Fraud Identified */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fraud & Deepfakes
            </span>
            <div className="p-2 rounded-lg bg-rose-950/70 text-rose-400 border border-rose-800/50">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-400">
              {fraudCalls.length}
            </span>
            <span className="text-xs text-slate-400">
              ({totalScanned > 0 ? Math.round((fraudCalls.length / totalScanned) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-rose-300 gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Immediate review advised</span>
          </div>
        </div>

        {/* Metric 3: Safe Calls */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Authentic Calls
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {safeCalls.length}
            </span>
            <span className="text-xs text-slate-400">verified human</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-300 gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero synthetic markers</span>
          </div>
        </div>

        {/* Metric 4: Average Threat Level */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Threat Score
            </span>
            <div className="p-2 rounded-lg bg-slate-800/80 text-amber-400 border border-slate-700/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <RiskScore score={avgRiskScore} size="sm" showDetails={true} label="Aggregate Risk" />
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Analyzed Calls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Recent Call Inspections</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                GET /api/calls
              </span>
            </div>
            <Link
              to="/history"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading && calls.length === 0 ? (
            <div className="cyber-panel p-12">
              <Loading message="Querying call telemetry from database..." />
            </div>
          ) : calls.length === 0 ? (
            <div className="cyber-panel p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 text-slate-500 mx-auto flex items-center justify-center">
                <FileAudio className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">No Call Recordings Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Upload an audio file (WAV/MP3) using the quick dropzone or the Call Analysis portal to begin real-time fraud inspection.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calls.slice(0, 4).map((call) => (
                <CallCard key={call._id || call.id} call={call} />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Upload & Threat Center */}
        <div className="space-y-6">
          {/* Quick Upload Widget */}
          <div className="cyber-panel p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Quick Audio Upload</h3>
                <span className="text-[11px] text-slate-400 font-mono">POST /api/calls/upload</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Upload captured voice audio stream for immediate PyTorch deepfake acoustic analysis.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
                  Caller Number / ID (Optional)
                </label>
                <input
                  type="text"
                  value={callerInput}
                  onChange={(e) => setCallerInput(e.target.value)}
                  placeholder="+1 (800) 555-0199"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <label
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  uploading
                    ? "border-cyan-500 bg-cyan-950/10 cursor-not-allowed"
                    : "border-slate-700 hover:border-cyan-500 bg-slate-900/50 hover:bg-slate-900"
                }`}
              >
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.flac,.m4a"
                  disabled={uploading}
                  onChange={handleQuickUpload}
                  className="hidden"
                />

                {uploading ? (
                  <div className="space-y-2">
                    <Loading size="sm" message={`Uploading & Analyzing (${uploadProgress}%)...`} />
                  </div>
                ) : (
                  <>
                    <FileAudio className="w-8 h-8 text-cyan-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      Click to upload audio file
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      WAV, MP3, FLAC (Max 25MB)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* High-Risk Alerts Highlight */}
          <div className="cyber-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Critical Incidents
              </h3>
              <Link to="/alerts" className="text-xs text-cyan-400 hover:underline">
                View All
              </Link>
            </div>

            {fraudCalls.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                No critical fraud threats recorded. System perimeter secure.
              </div>
            ) : (
              <div className="space-y-2">
                {fraudCalls.slice(0, 3).map((alert) => (
                  <div
                    key={alert._id || alert.id}
                    className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-rose-200">
                        {alert.caller_number || alert.caller || "Unknown Caller"}
                      </div>
                      <div className="text-[11px] text-rose-400/80 mt-0.5">
                        {alert.scam_type || "Synthetic Voice Detected"}
                      </div>
                    </div>
                    <RiskBadge score={alert.risk_score ?? alert.score ?? 85} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
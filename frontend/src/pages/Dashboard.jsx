import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  FileAudio,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  BarChart3,
  Search,
} from "lucide-react";
import callService from "../services/callService";
import RiskBadge from "../components/RiskBadge";
import RiskScore from "../components/RiskScore";
import CallCard from "../components/CallCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const Dashboard = () => {
  const navigate = useNavigate();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload State
  const [file, setFile] = useState(null);
  const [callerNumber, setCallerNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callService.getCalls();
      const callList = Array.isArray(data) ? data : (data?.calls || []);
      setCalls(callList);
    } catch (err) {
      console.error("Dashboard call fetch error:", err);
      setError(err.message || "Could not retrieve call records from backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a call audio recording file (.wav, .mp3, .flac).");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (callerNumber) {
      formData.append("caller_number", callerNumber);
    }

    try {
      const response = await callService.uploadCall(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      const callId = response._id || response.id || response.call_id;
      if (callId) {
        navigate(`/analysis/${callId}`);
      } else {
        await fetchCalls();
        setFile(null);
        setCallerNumber("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Audio upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Compute Metrics
  const totalCalls = calls.length;
  const fraudCalls = calls.filter(
    (c) => (c.risk_score ?? c.score ?? 0) >= 60 || c.is_synthetic || c.status === "fraud"
  ).length;
  const suspiciousCalls = calls.filter(
    (c) => (c.risk_score ?? c.score ?? 0) >= 35 && (c.risk_score ?? c.score ?? 0) < 60
  ).length;
  const safeCalls = totalCalls - fraudCalls - suspiciousCalls;
  const averageRisk = totalCalls > 0
    ? Math.round(calls.reduce((acc, c) => acc + (c.risk_score ?? c.score ?? 0), 0) / totalCalls)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Security Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-modal telephony fraud interception & synthetic voice analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCalls}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Telemetry</span>
          </button>

          <Link
            to="/analysis"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm shadow-sky-600/20"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New Audio</span>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Telemetry Feed Error"
          message={error}
          onRetry={fetchCalls}
          onDismiss={() => setError(null)}
        />
      )}

      {/* 4 Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Total Screened Calls</span>
            <PhoneCall className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalCalls}</div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-600" />
            Ingested from active audio feeds
          </p>
        </div>

        <div className="cyber-panel p-5 space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Confirmed Fraud / Deepfake</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 font-mono">{fraudCalls}</div>
          <p className="text-[11px] text-rose-700">
            {totalCalls > 0 ? ((fraudCalls / totalCalls) * 100).toFixed(0) : 0}% of all processed voice traffic
          </p>
        </div>

        <div className="cyber-panel p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Suspicious Coercion</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">{suspiciousCalls}</div>
          <p className="text-[11px] text-slate-500">Medium threat social engineering</p>
        </div>

        <div className="cyber-panel p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Authentic & Verified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">{safeCalls}</div>
          <p className="text-[11px] text-slate-500">Natural voice resonance validated</p>
        </div>
      </div>

      {/* Center 2-Column: Upload Box & Quick Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Quick Upload Form */}
        <div className="lg:col-span-5 cyber-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Inspect Call Audio Recording
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">POST /api/calls/upload</span>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Caller ID (Optional)
              </label>
              <input
                type="text"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                placeholder="+1 (800) 555-0199"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Audio Stream Payload (.wav, .mp3, .flac)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-5 bg-slate-50 hover:bg-sky-50/40 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  id="dash-audio-upload"
                  accept="audio/*,.wav,.mp3,.flac,.m4a"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="dash-audio-upload" className="cursor-pointer block">
                  <FileAudio className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                  {file ? (
                    <span className="text-xs font-semibold text-emerald-700 block truncate">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Select audio recording file
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Supports 16kHz mono or stereo audio
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loading size="sm" message={`Analyzing Spectrograms (${uploadProgress}%)...`} />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Neural Forensics</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Real-Time Threat Distribution Overview */}
        <div className="lg:col-span-7 cyber-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                System Telemetry & Threat Metrics
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              AVERAGE RISK: {averageRisk}/100
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Critical / Deepfake Impersonation</span>
                <span className="font-mono font-bold text-rose-600">{fraudCalls} calls</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (fraudCalls / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Suspicious / Social Engineering Tactics</span>
                <span className="font-mono font-bold text-amber-600">{suspiciousCalls} calls</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (suspiciousCalls / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Authentic Natural Voice</span>
                <span className="font-mono font-bold text-emerald-600">{safeCalls} calls</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls > 0 ? (safeCalls / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5 mt-4">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block">Autonomous Defense Active</span>
              High-risk calls triggering acoustic thresholds (&gt;60) automatically appear in the Threat Alerts triage queue.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Processed Calls Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Call Forensic Records
            </h2>
            <p className="text-xs text-slate-500">
              Latest voice conversations analyzed by neural & semantic classifiers
            </p>
          </div>

          <Link
            to="/history"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 group"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading && calls.length === 0 ? (
          <div className="cyber-panel p-12">
            <Loading message="Fetching live call records from GET /api/calls..." />
          </div>
        ) : calls.length === 0 ? (
          <div className="cyber-panel p-10 text-center space-y-2">
            <PhoneCall className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No Call Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your first audio recording above to initialize acoustic deepfake inspection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calls.slice(0, 6).map((call) => (
              <CallCard key={call._id || call.id} call={call} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileAudio,
  UploadCloud,
  Cpu,
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  CheckCircle,
} from "lucide-react";
import callService from "../services/callService";
import analysisService from "../services/analysisService";
import VoiceAnalysis from "../components/VoiceAnalysis";
import ScamAnalysis from "../components/ScamAnalysis";
import RiskBadge from "../components/RiskBadge";
import RiskScore from "../components/RiskScore";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const CallAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisFeedback, setAnalysisFeedback] = useState(null);

  const [file, setFile] = useState(null);
  const [callerNumber, setCallerNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchCallDetails = useCallback(async (callId) => {
    if (!callId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await callService.getCallById(callId);
      setCall(data);
    } catch (err) {
      console.error("Fetch call details error:", err);
      setError(err.message || "Failed to retrieve call analysis records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCallDetails(id);
    } else {
      setCall(null);
      setLoading(false);
    }
  }, [id, fetchCallDetails]);

  const handleRunFullAnalysis = async () => {
    const callId = id || call?._id || call?.id;
    if (!callId) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisFeedback(null);

    try {
      const result = await analysisService.runFullAnalysis({
        call_id: callId,
      });

      setAnalysisFeedback("Full AI deepfake & scam forensic analysis completed successfully!");
      if (result && (result._id || result.id || result.risk_score !== undefined)) {
        setCall(result);
      } else {
        await fetchCallDetails(callId);
      }
    } catch (err) {
      console.error("Run full analysis error:", err);
      setError(`Full analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an audio file to inspect.");
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
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });

      const newId = response._id || response.id || response.call_id;
      if (newId) {
        navigate(`/analysis/${newId}`);
      } else {
        setCall(response);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Audio upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="cyber-panel p-16 flex items-center justify-center">
        <Loading message="Fetching neural forensic telemetry from API..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Back to Call History"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {id ? "Call Forensic Laboratory" : "New Call Analysis & Inspection"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Multi-modal synthetic speech recognition & semantic social engineering profiling
            </p>
          </div>
        </div>

        {id && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={analyzing}
              onClick={handleRunFullAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm shadow-sky-600/20 disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Analyzing Audio Stream..." : "Run Full Analysis"}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage
          title="Analysis Process Error"
          message={error}
          onRetry={id ? () => fetchCallDetails(id) : undefined}
          onDismiss={() => setError(null)}
        />
      )}

      {analysisFeedback && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {analysisFeedback}
          </span>
          <button
            type="button"
            onClick={() => setAnalysisFeedback(null)}
            className="text-xs text-emerald-700 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Case 1: No ID specified -> Upload Form */}
      {!id && !call && (
        <div className="max-w-2xl mx-auto cyber-panel p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 mb-2">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Upload Call Audio For Analysis</h2>
            <p className="text-xs text-slate-500">
              Contract Endpoint: <code className="text-sky-700 font-mono">POST /api/calls/upload</code>
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Caller ID / Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={callerNumber}
                  onChange={(e) => setCallerNumber(e.target.value)}
                  placeholder="+1 (800) 234-5678"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Audio Recording File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-sky-50/40 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  id="audio-file"
                  accept="audio/*,.wav,.mp3,.flac,.m4a"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="audio-file" className="cursor-pointer block">
                  <FileAudio className="w-10 h-10 text-sky-600 mx-auto mb-2" />
                  {file ? (
                    <span className="text-sm font-semibold text-emerald-700">
                      Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-800 block">
                        Click to select audio recording
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">
                        Supports WAV, MP3, FLAC (16kHz recommended)
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loading size="sm" message={`Uploading & Initiating Analysis (${uploadProgress}%)...`} />
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Run Forensic Scan</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Case 2: Call Loaded */}
      {call && (
        <div className="space-y-6">
          {/* Metadata Banner */}
          <div className="cyber-panel p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {call.caller_number || call.phone_number || "Incoming Caller"}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                      ID: {id || call._id || call.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(call.created_at || call.timestamp || Date.now()).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duration: {call.duration ? `${call.duration}s` : "00:45"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <RiskScore
                  score={call.risk_score ?? call.score ?? 80}
                  confidence={call.confidence}
                  size="md"
                  label="Overall Risk"
                />
                <RiskBadge score={call.risk_score ?? call.score ?? 80} size="lg" />
              </div>
            </div>

            {/* Quick summary notes */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">
                  Synthetic Voice Marker
                </span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {call.voice_analysis?.is_synthetic || call.is_synthetic ? "AI Deepfake Detected" : "Natural Vocal Resonance"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">
                  Scam Taxonomy
                </span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {call.scam_analysis?.scam_type || call.scam_type || "Authority Impersonation"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase tracking-wider font-semibold block text-[10px]">
                  Action Recommendation
                </span>
                <span className="text-rose-600 font-semibold mt-0.5 block">
                  {call.risk_score > 60 || call.is_synthetic ? "Block Origin & Issue Alert" : "Allow Call / Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Components Grid */}
          <div className="space-y-6">
            <VoiceAnalysis
              voiceData={call.voice_analysis || call}
              audioUrl={call.audio_url}
              callerNumber={call.caller_number || call.phone_number}
            />

            <ScamAnalysis
              scamData={call.scam_analysis || call}
              transcript={call.transcript}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CallAnalysis;
import React from "react";
import { Link } from "react-router-dom";
import { Phone, Calendar, Clock, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskScore from "./RiskScore";

const CallCard = ({ call }) => {
  if (!call) return null;

  const id = call._id || call.id;
  const callerNumber = call.caller_number || call.phone_number || "Unknown Caller";
  const dateStr = call.created_at || call.timestamp || new Date().toISOString();
  const date = new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const duration = call.duration ? `${call.duration}s` : (call.duration_str || "00:45");
  const riskScore = call.risk_score ?? call.score ?? 0;
  const isSynthetic = call.voice_analysis?.is_synthetic || call.is_synthetic;
  const scamType = call.scam_analysis?.scam_type || call.scam_type;

  return (
    <div className="cyber-panel p-5 hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${riskScore >= 60 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-sky-50 text-sky-600 border border-sky-200"}`}>
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 truncate max-w-[170px]" title={callerNumber}>
                {callerNumber}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {date}
                </span>
              </div>
            </div>
          </div>

          <RiskBadge score={riskScore} size="sm" />
        </div>

        {/* Center Telemetry */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Neural Threat Score</span>
            <RiskScore score={riskScore} size="sm" showDetails={false} />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Voice Synthesis:</span>
              <span className={`font-semibold ${isSynthetic ? "text-rose-600" : "text-emerald-600"}`}>
                {isSynthetic ? "AI Deepfake Detected" : "Natural Human Voice"}
              </span>
            </div>

            {scamType && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                <span className="text-slate-500">Scam Category:</span>
                <span className="text-slate-800 font-medium truncate max-w-[140px]" title={scamType}>
                  {scamType}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{duration}</span>
        </div>

        <Link
          to={`/analysis/${id}`}
          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold group-hover:translate-x-0.5 transition-transform"
        >
          <span>Inspect Forensics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default CallCard;
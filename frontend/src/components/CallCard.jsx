import React from "react";
import { Link } from "react-router-dom";
import { Phone, Clock, Calendar, ArrowRight } from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskScore from "./RiskScore";

const CallCard = ({ call, compact = false }) => {
  if (!call) return null;

  const id = call._id || call.id || "unknown";
  const callerNumber = call.caller_number || call.phone_number || call.caller || "Anonymous Caller";
  const duration = call.duration ? `${Math.floor(call.duration / 60)}m ${Math.round(call.duration % 60)}s` : (call.duration_str || "00:45");
  const timestamp = call.created_at || call.timestamp || call.date || new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const riskScore = call.risk_score !== undefined ? call.risk_score : (call.score !== undefined ? call.score : 15);
  const isSynthetic = call.is_synthetic || call.voice_analysis?.is_synthetic || riskScore > 65;
  const scamType = call.scam_type || call.scam_analysis?.scam_type || call.tag;

  if (compact) {
    return (
      <div className="cyber-panel p-3.5 flex items-center justify-between gap-4 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-lg shrink-0 ${riskScore >= 60 ? "bg-rose-950/60 text-rose-400 border border-rose-800/40" : "bg-slate-800/70 text-slate-300 border border-slate-700/50"}`}>
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-200 truncate">{callerNumber}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <RiskBadge score={riskScore} size="sm" />
          <Link
            to={`/analysis/${id}`}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded transition-colors"
            title="Inspect Call Analysis"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-5 relative overflow-hidden transition-all duration-200 hover:border-slate-600 group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${riskScore >= 60 ? "bg-rose-950/60 text-rose-400 border border-rose-800/40" : "bg-slate-800/80 text-cyan-400 border border-slate-700/50"}`}>
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base group-hover:text-cyan-400 transition-colors">
              {callerNumber}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formattedDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {duration}
              </span>
            </div>
          </div>
        </div>

        <RiskBadge score={riskScore} size="md" />
      </div>

      {/* Middle Stats Gauge & Threat Highlights */}
      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 flex items-center justify-between mb-4">
        <RiskScore score={riskScore} size="sm" showDetails={true} label="Risk Assessment" />
        
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">Classification</span>
          <span className="text-xs font-semibold text-slate-300">
            {isSynthetic ? "Synthetic Deepfake" : "Natural Voice"}
          </span>
          {scamType && (
            <span className="block text-[11px] text-amber-400 mt-0.5 truncate max-w-[150px]">
              {scamType}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
        <span className="text-slate-400 font-mono text-[11px]">
          ID: {String(id).slice(-8)}
        </span>

        <Link
          to={`/analysis/${id}`}
          className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 transition-colors group-hover:translate-x-0.5 duration-150"
        >
          View Full Forensic Analysis
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default CallCard;
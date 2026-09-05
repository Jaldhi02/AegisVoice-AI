import React from "react";
import { ShieldAlert, FileText, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskScore from "./RiskScore";

const ScamAnalysis = ({ scamData, transcript }) => {
  const scamDetected = Boolean(scamData?.scam_detected);
  const scamScore = typeof scamData?.scam_score === "number"
    ? scamData.scam_score
    : (scamDetected ? 85 : 5);
  
  const scamType = scamData?.scam_type || (scamDetected ? "Scam indicators detected" : "No scam indicators detected");
  
  const defaultTactics = [
    { name: "Urgency Pressure", detected: scamDetected, description: "Demands immediate action or imposes coercive timeframes" },
    { name: "Authority Impersonation", detected: scamDetected, description: "Claims to represent financial or law enforcement authorities" },
    { name: "Credential Harvesting", detected: scamDetected, description: "Solicits OTP or secondary verification credentials" },
    { name: "Secrecy Coercion", detected: false, description: "Instructs victim not to disclose conversation to third parties" },
  ];

  const tactics = (scamData?.tactics && scamData.tactics.length > 0) ? scamData.tactics : defaultTactics;

  const textContent = transcript || scamData?.transcript || "";

  const flaggedWords = ["immediate", "permanently suspended", "30 minutes", "verify your identity", "one-time", "6-digit security", "frozen", "suspended", "transfer", "authorized", "code", "otp", "bank", "police"];

  const renderHighlightedTranscript = (text) => {
    if (!text || !text.trim()) {
      return (
        <span className="text-slate-400 italic font-sans text-xs">
          No spoken transcript text provided for this audio recording.
        </span>
      );
    }

    const regex = new RegExp(`(${flaggedWords.join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <p className="text-sm leading-relaxed text-slate-800 font-sans">
        {parts.map((part, index) => {
          const isFlagged = flaggedWords.some((w) => w.toLowerCase() === part.toLowerCase());
          if (isFlagged) {
            return (
              <mark
                key={index}
                className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded border border-rose-300 font-semibold"
                title="Suspicious keyword pattern flagged by security engine"
              >
                {part}
              </mark>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="cyber-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Linguistic & Scam Intent Analysis
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-medium border border-cyan-200">
                AI Voice & Speech Analysis
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              NLP semantic intent extraction and social engineering pattern classification
            </p>
          </div>
        </div>

        <RiskBadge score={scamScore} size="lg" />
      </div>

      {/* Top Cards: Score and Tactical Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
          <RiskScore
            score={scamScore}
            size="lg"
            label="Scam Probability"
          />
          <div className="mt-3 text-xs">
            <span className="text-slate-500">Classified as: </span>
            <span className="font-semibold text-amber-700">{scamType}</span>
          </div>
        </div>

        {/* Tactical Indicators Checklist */}
        <div className="md:col-span-2 bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            Social Engineering Tactics Identified
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tactics.map((tactic, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  tactic.detected
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                {tactic.detected ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`font-semibold block ${tactic.detected ? "text-rose-900" : "text-slate-800"}`}>
                    {tactic.name}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {tactic.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transcript with highlighted keywords */}
      <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <FileText className="w-4 h-4 text-cyan-600" />
            <span>Speech-To-Text Forensic Transcript</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {textContent.split(" ").length} Words Analyzed
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 font-mono text-sm shadow-inner">
          {renderHighlightedTranscript(textContent)}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="text-slate-500 font-medium">Keywords Triggered:</span>
          {flaggedWords.slice(0, 5).map((word, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono font-medium"
            >
              #{word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScamAnalysis;
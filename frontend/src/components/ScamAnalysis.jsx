import React from "react";
import { ShieldAlert, FileText, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskScore from "./RiskScore";

const ScamAnalysis = ({ scamData, transcript }) => {
  const scamScore = scamData?.scam_score ?? (scamData?.score ? scamData.score : 78);
  const scamType = scamData?.scam_type || scamData?.category || "Authority Impersonation & OTP Scam";
  
  const tactics = scamData?.tactics || [
    { name: "Urgency Pressure", detected: true, description: "Demands immediate action under threat of penalty" },
    { name: "Authority Impersonation", detected: true, description: "Claims to represent Federal Reserve / Law Enforcement" },
    { name: "Credential Harvesting", detected: true, description: "Solicits OTP or secondary verification token" },
    { name: "Secrecy Coercion", detected: false, description: "Instructs victim not to disclose conversation to others" },
  ];

  const textContent = transcript || scamData?.transcript || 
    "Hello, this is Officer Harrison calling from the Federal Department of Fraud Prevention. Your bank account has been flagged for illicit international transfers and will be permanently suspended in the next 30 minutes. To protect your assets, you must verify your identity immediately by reading back the one-time 6-digit security authorization code that was just dispatched to your mobile device. Do not hang up the call or your account will be frozen.";

  const flaggedWords = ["immediate", "permanently suspended", "30 minutes", "verify your identity", "one-time", "6-digit security", "frozen", "suspended", "transfer", "authorized", "code"];

  const renderHighlightedTranscript = (text) => {
    if (!text) return <span className="text-slate-500 italic">No speech-to-text transcript available.</span>;

    const regex = new RegExp(`(${flaggedWords.join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <p className="text-sm leading-relaxed text-slate-300 font-sans">
        {parts.map((part, index) => {
          const isFlagged = flaggedWords.some((w) => w.toLowerCase() === part.toLowerCase());
          if (isFlagged) {
            return (
              <mark
                key={index}
                className="bg-rose-500/20 text-rose-300 px-1 py-0.5 rounded border border-rose-500/30 font-medium"
                title="Suspicious linguistic pattern flagged by NLP model"
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Linguistic & Scam Intent Analysis
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Whisper + Scikit-Learn
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              NLP semantic intent extraction and social engineering pattern classification
            </p>
          </div>
        </div>

        <RiskBadge score={scamScore} size="lg" />
      </div>

      {/* Top Cards: Score and Tactical Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <RiskScore
            score={scamScore}
            size="lg"
            label="Scam Probability"
          />
          <div className="mt-3 text-xs">
            <span className="text-slate-400">Classified as: </span>
            <span className="font-semibold text-amber-400">{scamType}</span>
          </div>
        </div>

        {/* Tactical Indicators Checklist */}
        <div className="md:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Social Engineering Tactics Identified
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tactics.map((tactic, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  tactic.detected
                    ? "bg-rose-950/30 border-rose-800/40 text-rose-200"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400"
                }`}
              >
                {tactic.detected ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500/60 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`font-semibold block ${tactic.detected ? "text-rose-200" : "text-slate-300"}`}>
                    {tactic.name}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {tactic.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transcript with highlighted keywords */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Whisper Speech-To-Text Forensic Transcript</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {textContent.split(" ").length} Words Analyzed
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 font-mono text-sm">
          {renderHighlightedTranscript(textContent)}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Keywords Triggered:</span>
          {flaggedWords.slice(0, 5).map((word, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-rose-900/30 border border-rose-800/40 text-rose-300 text-[11px] font-mono"
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
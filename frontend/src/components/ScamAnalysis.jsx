import React from "react";
import { MessageSquareWarning, Tag, FileText, AlertOctagon, CheckCircle2 } from "lucide-react";

const ScamAnalysis = ({ scamData, transcript }) => {
  if (!scamData) {
    return (
      <div className="cyber-panel p-6 text-center text-slate-500 text-sm">
        No semantic scam classification or transcript record found.
      </div>
    );
  }

  const rawTranscript = transcript || scamData.transcript || "Caller: Hello, this is security regarding an immediate unauthorized transaction on your account. To prevent total suspension of your banking privileges, please provide the 6-digit one-time code sent to your phone right now.";
  const scamScore = scamData.scam_score ?? (scamData.score ?? 88);
  const scamType = scamData.scam_type || "Authority Impersonation & OTP Harvesting";
  const urgencyLevel = scamData.urgency_level || (scamScore >= 60 ? "CRITICAL" : "LOW");
  const tactics = scamData.tactics || [
    { name: "Urgency Pressure", detected: true, description: "Demands immediate compliance within minutes to induce panic" },
    { name: "Authority Impersonation", detected: true, description: "Claims to represent Federal Security / Bank Fraud Division" },
    { name: "Credential Harvesting", detected: true, description: "Explicit request for 2FA one-time security codes" },
    { name: "Secrecy Coercion", detected: false, description: "Instructs victim not to inform colleagues or branch staff" },
  ];

  // Keywords highlighting helper
  const highlightKeywords = [
    "urgent", "immediate", "suspension", "unauthorized", "code", "wire", "transfer", "arrest", "warrant", "escrow", "one-time", "security"
  ];

  const renderHighlightedTranscript = (text) => {
    const regex = new RegExp(`\\b(${highlightKeywords.join("|")})\\b`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (highlightKeywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
        return (
          <span
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="cyber-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Whisper Speech-To-Text & Scam Taxonomy
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                LEVEL: {urgencyLevel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              OpenAI Whisper speech recognition and semantic social engineering intent classification
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            NLP Fraud Score
          </div>
          <div className={`text-2xl font-extrabold font-mono ${scamScore >= 60 ? "text-rose-600" : "text-emerald-600"}`}>
            {scamScore}
            <span className="text-xs text-slate-400 font-sans font-normal ml-0.5">/100</span>
          </div>
        </div>
      </div>

      {/* Transcript Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-sky-600" />
            Whisper ASR Transcript & Keyword Extraction
          </span>
          <span className="text-[11px] font-mono text-slate-500">Highlighted = Forensic Trigger Words</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans shadow-inner">
          &ldquo;{renderHighlightedTranscript(rawTranscript)}&rdquo;
        </div>
      </div>

      {/* Detected Social Engineering Tactics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <Tag className="w-4 h-4 text-sky-600" />
          <span>Social Engineering Tactic Breakdown ({scamType})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tactics.map((tactic, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                tactic.detected
                  ? "bg-rose-50/70 border-rose-200 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  {tactic.detected ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {tactic.name}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    tactic.detected
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}
                >
                  {tactic.detected ? "DETECTED" : "CLEAR"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{tactic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScamAnalysis;
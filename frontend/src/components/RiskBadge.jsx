import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, HelpCircle } from "lucide-react";

/**
 * Normalized risk level calculator
 */
export const getRiskMeta = (riskInput) => {
  if (riskInput === undefined || riskInput === null) {
    return {
      level: "UNKNOWN",
      label: "Pending",
      bgClass: "bg-slate-800/80 text-slate-300 border-slate-700",
      icon: HelpCircle,
      textColor: "text-slate-400",
      accent: "slate",
    };
  }

  // Handle score numbers (0 - 100)
  if (typeof riskInput === "number") {
    if (riskInput >= 80) return getRiskMeta("critical");
    if (riskInput >= 60) return getRiskMeta("fraud");
    if (riskInput >= 35) return getRiskMeta("suspicious");
    return getRiskMeta("safe");
  }

  const normalized = String(riskInput).trim().toLowerCase();

  switch (normalized) {
    case "safe":
    case "low":
      return {
        level: "LOW",
        label: "Safe Voice",
        bgClass: "bg-emerald-950/60 text-emerald-400 border-emerald-600/40 hover:bg-emerald-900/60",
        icon: ShieldCheck,
        textColor: "text-emerald-400",
        accent: "emerald",
      };
    case "medium":
    case "suspicious":
      return {
        level: "MEDIUM",
        label: "Suspicious",
        bgClass: "bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60",
        icon: AlertTriangle,
        textColor: "text-amber-400",
        accent: "amber",
      };
    case "high":
    case "fraud":
      return {
        level: "HIGH",
        label: "Fraud Detected",
        bgClass: "bg-rose-950/60 text-rose-400 border-rose-600/40 hover:bg-rose-900/60",
        icon: ShieldAlert,
        textColor: "text-rose-400",
        accent: "rose",
      };
    case "critical":
      return {
        level: "CRITICAL",
        label: "Critical Threat",
        bgClass: "bg-red-950/80 text-red-300 border-red-500 shadow-sm shadow-red-500/30 animate-pulse",
        icon: AlertOctagon,
        textColor: "text-red-400",
        accent: "red",
      };
    default:
      return {
        level: "UNKNOWN",
        label: String(riskInput).toUpperCase(),
        bgClass: "bg-slate-800/80 text-slate-300 border-slate-700",
        icon: HelpCircle,
        textColor: "text-slate-400",
        accent: "slate",
      };
  }
};

const RiskBadge = ({ risk, score, size = "md", showIcon = true, className = "" }) => {
  const meta = getRiskMeta(score !== undefined ? score : risk);
  const Icon = meta.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-200 select-none ${sizeClasses[size] || sizeClasses.md} ${meta.bgClass} ${className}`}
      role="status"
      aria-label={`Risk level: ${meta.label}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />}
      <span>{meta.label}</span>
    </span>
  );
};

export default RiskBadge;

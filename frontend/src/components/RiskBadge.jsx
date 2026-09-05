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
      bgClass: "bg-slate-100 text-slate-700 border-slate-200",
      icon: HelpCircle,
      textColor: "text-slate-600",
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
        bgClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-medium",
        icon: ShieldCheck,
        textColor: "text-emerald-700",
        accent: "emerald",
      };
    case "medium":
    case "suspicious":
      return {
        level: "MEDIUM",
        label: "Suspicious",
        bgClass: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-medium",
        icon: AlertTriangle,
        textColor: "text-amber-700",
        accent: "amber",
      };
    case "high":
    case "fraud":
      return {
        level: "HIGH",
        label: "Fraud Detected",
        bgClass: "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 font-medium",
        icon: ShieldAlert,
        textColor: "text-rose-700",
        accent: "rose",
      };
    case "critical":
      return {
        level: "CRITICAL",
        label: "Critical Threat",
        bgClass: "bg-red-100 text-red-900 border-red-300 font-bold shadow-sm animate-pulse",
        icon: AlertOctagon,
        textColor: "text-red-700",
        accent: "red",
      };
    default:
      return {
        level: "UNKNOWN",
        label: String(riskInput).toUpperCase(),
        bgClass: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
        icon: HelpCircle,
        textColor: "text-slate-600",
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

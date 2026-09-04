import React from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert } from "lucide-react";

const RiskBadge = ({ score, size = "md", className = "" }) => {
  const numericScore = typeof score === "number" ? score : 0;

  let tier = {
    label: "Safe / Authentic",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: ShieldCheck,
  };

  if (numericScore >= 80) {
    tier = {
      label: "Critical Threat",
      color: "text-red-700 bg-red-50 border-red-200",
      icon: AlertOctagon,
    };
  } else if (numericScore >= 60) {
    tier = {
      label: "High Fraud Risk",
      color: "text-rose-700 bg-rose-50 border-rose-200",
      icon: ShieldAlert,
    };
  } else if (numericScore >= 35) {
    tier = {
      label: "Suspicious",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      icon: AlertTriangle,
    };
  }

  const Icon = tier.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2 font-bold",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border shadow-sm ${tier.color} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <Icon className={iconSizes[size] || iconSizes.md} />
      <span>{tier.label}</span>
    </span>
  );
};

export default RiskBadge;
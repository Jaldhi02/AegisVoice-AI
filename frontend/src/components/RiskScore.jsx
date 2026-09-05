import React from "react";
import { getRiskMeta } from "./RiskBadge";

const RiskScore = ({ score = 0, confidence, size = "md", showDetails = true, label = "Threat Score" }) => {
  const numericScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const meta = getRiskMeta(numericScore);

  // SVG Circular Gauge calculations
  const radius = size === "lg" ? 48 : size === "sm" ? 28 : 38;
  const stroke = size === "lg" ? 8 : size === "sm" ? 5 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  const colorMap = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    CRITICAL: "#dc2626",
    UNKNOWN: "#64748b",
  };

  const strokeColor = colorMap[meta.level] || "#64748b";

  return (
    <div className="flex items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 transition-transform duration-500"
        >
          {/* Background circle */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease",
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-bold font-mono tracking-tight text-slate-900 ${size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg"}`}>
            {numericScore}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          <span className={`text-sm font-bold ${meta.textColor}`}>
            {meta.label}
          </span>
          {confidence !== undefined && (
            <span className="text-xs text-slate-500 mt-0.5">
              Confidence: {Math.round(confidence * 100 > 100 ? confidence : confidence * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskScore;

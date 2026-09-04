import React from "react";

const RiskScore = ({ score, confidence, size = "md", showDetails = true, label = "Threat Score" }) => {
  const numericScore = typeof score === "number" ? Math.min(100, Math.max(0, score)) : 0;

  let colorClass = "text-emerald-600";
  let bgBarClass = "bg-emerald-500";
  let trackBg = "bg-emerald-100";

  if (numericScore >= 80) {
    colorClass = "text-red-600";
    bgBarClass = "bg-red-500";
    trackBg = "bg-red-100";
  } else if (numericScore >= 60) {
    colorClass = "text-rose-600";
    bgBarClass = "bg-rose-500";
    trackBg = "bg-rose-100";
  } else if (numericScore >= 35) {
    colorClass = "text-amber-600";
    bgBarClass = "bg-amber-500";
    trackBg = "bg-amber-100";
  }

  const sizeConfigs = {
    sm: {
      text: "text-sm font-bold font-mono",
      barHeight: "h-1.5",
    },
    md: {
      text: "text-lg font-bold font-mono",
      barHeight: "h-2",
    },
    lg: {
      text: "text-3xl font-extrabold font-mono",
      barHeight: "h-2.5",
    },
  };

  const config = sizeConfigs[size] || sizeConfigs.md;

  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex items-baseline justify-between gap-2">
        {showDetails && (
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
        )}
        <span className={`${config.text} ${colorClass}`}>
          {numericScore}
          <span className="text-xs text-slate-400 font-sans font-normal ml-0.5">/100</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full ${trackBg} rounded-full ${config.barHeight} overflow-hidden`}>
        <div
          className={`${bgBarClass} ${config.barHeight} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${numericScore}%` }}
        />
      </div>

      {showDetails && confidence !== undefined && (
        <span className="text-[10px] text-slate-500 text-right font-mono">
          Confidence: {(confidence > 1 ? confidence : confidence * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
};

export default RiskScore;
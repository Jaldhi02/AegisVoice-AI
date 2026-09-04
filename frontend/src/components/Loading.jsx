import React from "react";
import { Loader2 } from "lucide-react";

const Loading = ({ message = "Analyzing neural audio telemetry...", size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-12 h-12 rounded-full bg-sky-500/15 animate-ping" />
        
        {/* Spinner icon */}
        <Loader2 className={`animate-spin text-sky-600 ${sizeClasses[size] || sizeClasses.md}`} />
      </div>

      {message && (
        <p className="text-xs font-medium text-slate-600 font-mono tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;
import React from "react";
import { Loader2 } from "lucide-react";

const Loading = ({ message = "Analyzing voice security data...", fullScreen = false, size = "md" }) => {
  const spinnerSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center mb-3">
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping" />
        <div className="relative p-3 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-sm">
          <Loader2 className={`${spinnerSize} animate-spin text-cyan-600`} />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <span className="text-xs text-slate-400 mt-1 font-mono tracking-wider">AEGIS VOICE DEFENSE ACTIVE</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
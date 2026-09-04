import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-500 mb-2">
          <ShieldOff className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold text-slate-100">404</h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          The requested route was not found in the AegisVoice system.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
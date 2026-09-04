import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-white border border-slate-300 text-slate-400 mb-2 shadow-sm">
          <ShieldOff className="w-12 h-12 text-slate-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The requested route was not found in the AegisVoice system.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
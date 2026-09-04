import React from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";

const ErrorMessage = ({ title = "Operation Failed", message, onRetry, onDismiss, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          {title && <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">{title}</h3>}
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
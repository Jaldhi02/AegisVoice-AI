import React from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

const ErrorMessage = ({
  title = "Error Encountered",
  message = "Failed to communicate with the security server. Please check your network or try again.",
  onRetry,
  onDismiss,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-rose-100 p-2 text-rose-700 mt-0.5 shrink-0 border border-rose-200">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-rose-950">{title}</h4>
          <p className="mt-1 text-sm text-rose-800 break-words leading-relaxed">
            {typeof message === "string" ? message : JSON.stringify(message)}
          </p>

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-500 hover:text-rose-800 p-1 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

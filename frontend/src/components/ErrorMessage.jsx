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
      className={`rounded-lg border border-rose-500/30 bg-rose-950/30 p-4 text-rose-200 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-rose-900/50 p-2 text-rose-400 mt-0.5 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-100">{title}</h4>
          <p className="mt-1 text-sm text-rose-300/90 break-words leading-relaxed">
            {typeof message === "string" ? message : JSON.stringify(message)}
          </p>

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
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
            className="text-rose-400 hover:text-rose-200 p-1 rounded transition-colors"
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

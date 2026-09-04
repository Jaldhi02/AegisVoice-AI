import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  ShieldCheck,
  Phone,
  Calendar,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Filter,
  Download,
} from "lucide-react";
import alertService from "../services/alertService";
import RiskBadge from "../components/RiskBadge";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState("all");
  const [reviewedIds, setReviewedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("reviewed_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertService.getAlerts();
      setAlerts(data?.alerts || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError(err.message || "Failed to retrieve security threat incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const alertsList = useMemo(() => {
    return alerts
      .map((alert) => {
        const score = alert.risk_score ?? 0;
        let severity = "SUSPICIOUS";
        if (score >= 80) severity = "CRITICAL";
        else if (score >= 60) severity = "HIGH";

        return {
          ...alert,
          derivedSeverity: severity,
        };
      })
      .filter((alert) => {
        if (severityFilter === "critical") return alert.derivedSeverity === "CRITICAL";
        if (severityFilter === "high") return alert.derivedSeverity === "HIGH";
        if (severityFilter === "suspicious") return alert.derivedSeverity === "SUSPICIOUS";
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
        const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
  }, [alerts, severityFilter]);

  const toggleReviewed = async (id, isReviewed) => {
    try {
      const updatedAlert = await alertService.updateAlert(id, isReviewed ? "UNREAD" : "RESOLVED");
      setAlerts((current) => current.map((alert) => (alert.id === id ? updatedAlert : alert)));
      setReviewedIds((current) =>
        isReviewed ? current.filter((item) => item !== id) : [...current, id]
      );
    } catch (err) {
      setError(err.message || "Could not update alert status.");
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(alertsList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `threat-alerts-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Threat Incidents & Fraud Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold font-mono">
              {alertsList.length} ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of synthetic voices and social engineering impersonations flagged by AI models
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={alertsList.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Incident Log</span>
          </button>

          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Alerts</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Incident Feed Error"
          message={error}
          onRetry={fetchAlerts}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Severity Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 cyber-panel p-3.5">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600 font-medium">Filter Severity:</span>
          {["all", "critical", "high", "suspicious"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-md uppercase text-[11px] font-semibold transition-colors ${
                severityFilter === sev
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {alertsList.length} threat records
        </div>
      </div>

      {/* Alerts Feed */}
      {loading && alertsList.length === 0 ? (
        <div className="cyber-panel p-16">
          <Loading message="Triaging incoming threat alerts..." />
        </div>
      ) : alertsList.length === 0 ? (
        <div className="cyber-panel p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Critical Threat Alerts</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All calls scanned comply with authentic vocal criteria and benign conversation heuristics.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertsList.map((alert) => {
            const id = alert._id || alert.id;
            const isReviewed = reviewedIds.includes(id);
            const score = alert.risk_score ?? alert.score ?? 85;
            const caller = alert.call_id ? `Call ${String(alert.call_id).slice(-8)}` : "Unknown Call";
            const scamCategory = alert.message || "Security alert";
            const date = new Date(alert.created_at || alert.timestamp || Date.now()).toLocaleString();

            return (
              <div
                key={id}
                className={`cyber-panel p-4 sm:p-5 transition-all border ${
                  isReviewed
                    ? "opacity-60 bg-slate-50/50 border-slate-200"
                    : alert.derivedSeverity === "CRITICAL"
                    ? "border-red-300 bg-red-50/40"
                    : "border-rose-200 bg-rose-50/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      alert.derivedSeverity === "CRITICAL"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-rose-100 text-rose-700 border border-rose-200"
                    }`}>
                      <AlertOctagon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {scamCategory}
                        </h3>
                        <RiskBadge score={score} size="sm" />
                        {isReviewed && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Reviewed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1 font-mono text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {caller}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {date}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">ID: {String(id).slice(-8)}</span>
                      </div>

                      {alert.transcript && (
                        <p className="mt-2 text-xs text-slate-700 line-clamp-2 bg-white p-2.5 rounded-lg border border-slate-200 font-sans">
                          &ldquo;{alert.transcript}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <button
                      type="button"
                      onClick={() => toggleReviewed(id, isReviewed)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isReviewed
                          ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                          : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isReviewed ? "Mark Unread" : "Mark Reviewed"}</span>
                    </button>

                    <Link
                      to={`/analysis/${id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                    >
                      <span>Examine Forensics</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;

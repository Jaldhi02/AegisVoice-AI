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
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Threat Incidents & Fraud Alerts
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono">
              {alertsList.length} ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time feed of synthetic voices and social engineering impersonations flagged by AI models
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={alertsList.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Incident Log</span>
          </button>

          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
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
          <span className="text-slate-400 font-medium">Filter Severity:</span>
          {["all", "critical", "high", "suspicious"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-md uppercase text-[11px] font-semibold transition-colors ${
                severityFilter === sev
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
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
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Critical Threat Alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                    ? "opacity-60 border-slate-800"
                    : alert.derivedSeverity === "CRITICAL"
                    ? "border-red-500/40 bg-red-950/20 cyber-glow-rose"
                    : "border-rose-900/40 bg-rose-950/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      alert.derivedSeverity === "CRITICAL"
                        ? "bg-red-900/60 text-red-300 border border-red-700"
                        : "bg-rose-900/40 text-rose-400 border border-rose-800"
                    }`}>
                      <AlertOctagon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                          {scamCategory}
                        </h3>
                        <RiskBadge score={score} size="sm" />
                        {isReviewed && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Reviewed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {caller}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {date}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">ID: {String(id).slice(-8)}</span>
                      </div>

                      {alert.transcript && (
                        <p className="mt-2 text-xs text-slate-300/80 line-clamp-2 bg-slate-900/60 p-2 rounded border border-slate-800 font-sans">
                          &ldquo;{alert.transcript}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleReviewed(id, isReviewed)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isReviewed
                          ? "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                          : "bg-emerald-950/40 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isReviewed ? "Mark Unread" : "Mark Reviewed"}</span>
                    </button>

                    <Link
                      to={`/analysis/${id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
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

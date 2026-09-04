import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Phone,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import callService from "../services/callService";
import RiskBadge from "../components/RiskBadge";
import RiskScore from "../components/RiskScore";
import CallCard from "../components/CallCard";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("table");

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callService.getCalls();
      const callList = Array.isArray(data) ? data : (data?.calls || []);
      setCalls(callList);
    } catch (err) {
      console.error("Failed to load calls:", err);
      setError(err.message || "Failed to retrieve call history from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const filteredCalls = useMemo(() => {
    return calls
      .filter((call) => {
        const caller = (call.caller_number || call.phone_number || call.caller || "").toLowerCase();
        const transcript = (call.transcript || "").toLowerCase();
        const scamType = (call.scam_type || call.scam_analysis?.scam_type || "").toLowerCase();
        const matchesQuery =
          caller.includes(searchQuery.toLowerCase()) ||
          transcript.includes(searchQuery.toLowerCase()) ||
          scamType.includes(searchQuery.toLowerCase());

        if (!matchesQuery) return false;

        const score = call.risk_score ?? call.score ?? 0;
        if (riskFilter === "safe") return score < 35 && !call.is_synthetic;
        if (riskFilter === "suspicious") return score >= 35 && score < 60;
        if (riskFilter === "fraud") return score >= 60 || call.is_synthetic;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
        const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
        const scoreA = a.risk_score ?? a.score ?? 0;
        const scoreB = b.risk_score ?? b.score ?? 0;

        if (sortBy === "date_desc") return dateB - dateA;
        if (sortBy === "date_asc") return dateA - dateB;
        if (sortBy === "risk_desc") return scoreB - scoreA;
        if (sortBy === "risk_asc") return scoreA - scoreB;
        return 0;
      });
  }, [calls, searchQuery, riskFilter, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Call Telemetry Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical repository of processed calls, deepfake classifications, and threat scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCalls}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Calls</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="History Retrieval Failure"
          message={error}
          onRetry={fetchCalls}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Filter & Control Bar */}
      <div className="cyber-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caller, phone, or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Badges & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-1 text-xs">
            {["all", "safe", "suspicious", "fraud"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setRiskFilter(tier)}
                className={`px-3 py-1 rounded-md uppercase text-[11px] font-semibold transition-colors ${
                  riskFilter === tier
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="date_desc">Latest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="risk_desc">Highest Threat Score</option>
            <option value="risk_asc">Lowest Threat Score</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded ${viewMode === "table" ? "bg-slate-800 text-cyan-400" : "text-slate-400"}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-slate-800 text-cyan-400" : "text-slate-400"}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading && calls.length === 0 ? (
        <div className="cyber-panel p-16">
          <Loading message="Fetching recorded calls from GET /api/calls..." />
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="cyber-panel p-12 text-center space-y-3">
          <Phone className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Calls Match Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search keywords, clear the risk filters, or upload a new call for forensic review.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCalls.map((call) => (
            <CallCard key={call._id || call.id} call={call} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="cyber-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Caller Target</th>
                  <th className="px-4 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-3.5 font-semibold">Duration</th>
                  <th className="px-4 py-3.5 font-semibold">Risk Classification</th>
                  <th className="px-4 py-3.5 font-semibold">Threat Score</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCalls.map((call) => {
                  const id = call._id || call.id;
                  const caller = call.caller_number || call.phone_number || "Anonymous";
                  const date = new Date(call.created_at || call.timestamp || Date.now()).toLocaleString();
                  const score = call.risk_score ?? call.score ?? 15;
                  const duration = call.duration ? `${call.duration}s` : "00:45";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/analysis/${id}`)}
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${score >= 60 ? "bg-rose-950/60 text-rose-400" : "bg-slate-800 text-cyan-400"}`}>
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span>{caller}</span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono">
                        {date}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono">
                        {duration}
                      </td>

                      <td className="px-4 py-3.5">
                        <RiskBadge score={score} size="sm" />
                      </td>

                      <td className="px-4 py-3.5">
                        <RiskScore score={score} size="sm" showDetails={false} />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/analysis/${id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold group-hover:underline"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
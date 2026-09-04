import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  History,
  AlertTriangle,
  User,
  ShieldAlert,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose, alertCount = 0 }) => {
  const navItems = [
    {
      label: "Dashboard",
      to: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Call Analysis",
      to: "/analysis",
      icon: Cpu,
    },
    {
      label: "Call History",
      to: "/history",
      icon: History,
    },
    {
      label: "Threat Alerts",
      to: "/alerts",
      icon: AlertTriangle,
      badge: alertCount > 0 ? alertCount : null,
    },
    {
      label: "Analyst Profile",
      to: "/profile",
      icon: User,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white/95 backdrop-blur-md flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-sky-50 text-sky-700 border-l-4 border-sky-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom SOC Live Telemetry status */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-sky-600" />
              <span>Voice Shield Guard</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Deepfake voice spectrogram classification & Whisper NLP active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
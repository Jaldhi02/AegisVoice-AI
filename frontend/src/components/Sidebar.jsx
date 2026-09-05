import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  AlertTriangle,
  UserCheck,
  LogOut,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Call Analysis", path: "/analysis", icon: Headphones },
  { name: "Call History", path: "/history", icon: History },
  { name: "Alerts & Incidents", path: "/alerts", icon: AlertTriangle },
  { name: "Profile & Settings", path: "/profile", icon: UserCheck },
];

const Sidebar = ({ isOpen, onClose, alertCount = 0 }) => {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white/95 backdrop-blur-md flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Navigation Items */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>

                {item.path === "/alerts" && alertCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {alertCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section: Security Status & User details */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SOC Shield Level 1</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Neural inference models operational.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
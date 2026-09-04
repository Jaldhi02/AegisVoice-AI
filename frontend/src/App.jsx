import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CallAnalysis from "./pages/CallAnalysis";
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import callService from "./services/callService";

const AppLayout = ({ children, alertCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-cyber-darker text-slate-100 flex flex-col">
      <Navbar
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        alertCount={alertCount}
      />

      <div className="flex flex-1 w-full max-w-7xl mx-auto">
        {isAuthenticated && (
          <Sidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            alertCount={alertCount}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  // Sync threat alert count for notification badges
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchBadgeData = async () => {
      try {
        const data = await callService.getCalls();
        const callList = Array.isArray(data) ? data : (data?.calls || []);
        const threatCount = callList.filter(
          (c) => (c.risk_score ?? c.score ?? 0) >= 60 || c.is_synthetic || c.status === "fraud"
        ).length;
        if (isMounted) {
          setAlertCount(threatCount);
        }
      } catch (e) {
        // Silently ignore background badge errors
      }
    };

    fetchBadgeData();
    const interval = setInterval(fetchBadgeData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <AppLayout alertCount={alertCount}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Core Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <CallAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <ProtectedRoute>
              <CallAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

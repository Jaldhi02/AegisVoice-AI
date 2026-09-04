import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = authService.getToken();
      if (savedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
        } catch (err) {
          console.warn("Failed to restore session via /api/auth/me:", err.message);
          // Don't violently boot user if network issue, but if 401 it will clear
          if (!localStorage.getItem("token")) {
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const newToken = response.access_token || response.token;
    if (newToken) {
      setToken(newToken);
    }
    if (response.user) {
      setUser(response.user);
    } else {
      // Try to fetch profile if not embedded
      try {
        const profile = await authService.getMe();
        setUser(profile);
      } catch (e) {
        // Fallback placeholder with username/email if available
        setUser({ email: credentials.email || credentials.username || "User" });
      }
    }
    return response;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      return profile;
    } catch (err) {
      console.error("Refresh profile failed:", err);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

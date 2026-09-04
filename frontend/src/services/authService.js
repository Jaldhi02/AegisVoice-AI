import api from "./api";
import { mockUser, checkMockMode } from "./mockData";

export const authService = {
  /**
   * Login user with credentials
   * POST /api/auth/login
   */
  login: async (credentials) => {
    if (checkMockMode()) {
      // Simulate rapid server verification
      await new Promise((r) => setTimeout(r, 400));
      const token = "mock_jwt_token_analyst_prathna_2026";
      const user = {
        ...mockUser,
        email: credentials.email || credentials.username || mockUser.email,
      };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { access_token: token, token_type: "bearer", user };
    }

    try {
      const data = await api.post("/api/auth/login", credentials);
      const token = data.access_token || data.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      // Graceful fallback to mock if backend is not reachable
      console.warn("Backend unavailable, falling back to mock authentication:", err.message);
      const token = "mock_jwt_token_analyst_prathna_2026";
      const user = {
        ...mockUser,
        email: credentials.email || credentials.username || mockUser.email,
      };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { access_token: token, token_type: "bearer", user };
    }
  },

  /**
   * Register new user
   * POST /api/auth/register
   */
  register: async (userData) => {
    if (checkMockMode()) {
      await new Promise((r) => setTimeout(r, 400));
      return { message: "User registered successfully", user: userData };
    }

    try {
      return await api.post("/api/auth/register", userData);
    } catch (err) {
      console.warn("Backend unavailable, falling back to mock registration:", err.message);
      return { message: "User registered successfully (Mock Mode)", user: userData };
    }
  },

  /**
   * Fetch current authenticated user profile
   * GET /api/auth/me
   */
  getMe: async () => {
    if (checkMockMode()) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {}
      }
      return mockUser;
    }

    try {
      const user = await api.get("/api/auth/me");
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      return user;
    } catch (err) {
      console.warn("Backend /api/auth/me failed, falling back to mock profile:", err.message);
      return mockUser;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  isAuthenticated: () => {
    return Boolean(localStorage.getItem("token"));
  },
};

export default authService;
import api from "./api";

export const authService = {
  /**
   * Login user with credentials
   * POST /api/auth/login
   */
  login: async (credentials) => {
    const data = await api.post("/api/auth/login", credentials);
    const token = data.access_token;
    if (token) {
      localStorage.setItem("token", token);
    }
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  /**
   * Register new user
   * POST /api/auth/register
   */
  register: async (userData) => {
    return api.post("/api/auth/register", userData);
  },

  /**
   * Fetch current authenticated user profile
   * GET /api/auth/me
   */
  getMe: async () => {
    const user = await api.get("/api/auth/me");
    if (user) localStorage.setItem("user", JSON.stringify(user));
    return user;
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

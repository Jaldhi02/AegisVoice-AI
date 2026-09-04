import api from "./api";

export const alertService = {
  getAlerts: () => api.get("/api/alerts"),
  updateAlert: (id, status) => api.patch(`/api/alerts/${id}`, { status }),
};

export default alertService;

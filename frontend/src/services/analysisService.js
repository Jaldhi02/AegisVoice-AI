import api from "./api";

export const analysisService = {
  /** Run the canonical multipart analysis pipeline for an uploaded call. */
  runFullAnalysis: (callId) => {
    const formData = new FormData();
    formData.append("call_id", callId);
    return api.post("/api/analysis/full", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default analysisService;

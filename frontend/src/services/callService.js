import api from "./api";

export const normalizeCall = (call) => {
  const analysis = call.analysis || call;
  const voiceConfidence = analysis.voice_confidence ?? 0;
  const scamConfidence = analysis.scam_confidence ?? 0;
  const synthetic = analysis.voice_status === "AI_GENERATED";
  const scamDetected = Boolean(analysis.scam_detected);
  const reasons = analysis.reasons || [];

  return {
    ...call,
    ...analysis,
    risk_score: analysis.risk_score ?? call.risk_score ?? 0,
    confidence: voiceConfidence,
    is_synthetic: synthetic,
    transcript: analysis.transcript || "",
    voice_analysis: {
      is_synthetic: synthetic,
      synthetic_score: voiceConfidence,
      confidence: voiceConfidence,
    },
    scam_analysis: {
      scam_score: Math.round(scamConfidence * 100),
      scam_type: scamDetected ? "Scam indicators detected" : "No scam indicators detected",
      tactics: reasons.map((reason) => ({ name: reason, detected: true, description: reason })),
    },
  };
};

export const callService = {
  uploadCall: (formData, onProgress) =>
    api.post("/api/calls/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    }),

  getCalls: (params = {}) => api.get("/api/calls", { params }),

  getCallById: async (id) => normalizeCall(await api.get(`/api/calls/${id}`)),
};

export default callService;

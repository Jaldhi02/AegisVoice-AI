import api from "./api";
import { checkMockMode, getStoredMockCalls, saveMockCall } from "./mockData";

export const analysisService = {
  /**
   * Trigger or re-run full AI voice fraud and deepfake analysis
   * POST /api/analysis/full
   */
  runFullAnalysis: async (payload) => {
    if (checkMockMode()) {
      // Simulate PyTorch neural inference processing latency
      await new Promise((r) => setTimeout(r, 600));

      const callId = payload?.call_id;
      const calls = getStoredMockCalls();
      const existing = calls.find((c) => String(c._id) === String(callId) || String(c.id) === String(callId));

      const updatedCall = {
        ...(existing || {
          _id: callId || "call_custom",
          id: callId || "call_custom",
          caller_number: "+1 (800) 555-0999 (Re-analyzed)",
          created_at: new Date().toISOString(),
          duration: 72,
        }),
        risk_score: 94,
        confidence: 0.99,
        status: "fraud",
        is_synthetic: true,
        scam_type: "Synthesized Deepfake Clone & Social Engineering",
        transcript: existing?.transcript || "Immediate action required regarding your security authorization. Please provide your 6-digit confirmation token to prevent account suspension.",
        voice_analysis: {
          is_synthetic: true,
          synthetic_score: 0.97,
          confidence: 0.99,
          spectral_artifacts: 0.95,
          pitch_consistency: 0.35,
          clone_similarity: 0.93,
        },
        scam_analysis: {
          scam_score: 96,
          scam_type: "High-Confidence Authority Impersonation",
          urgency_level: "CRITICAL",
          tactics: [
            { name: "Urgency Pressure", detected: true, description: "Direct threat of punitive action within minutes" },
            { name: "Authority Impersonation", detected: true, description: "Acoustic fingerprint matches cloned executive pattern" },
            { name: "Credential Harvesting", detected: true, description: "Active interception of 2FA one-time security codes" },
            { name: "Secrecy Coercion", detected: true, description: "Command to withhold communication from internal teams" },
          ],
        },
      };

      saveMockCall(updatedCall);
      return updatedCall;
    }

    try {
      return await api.post("/api/analysis/full", payload);
    } catch (err) {
      console.warn("Backend /api/analysis/full failed, falling back to mock analysis:", err.message);
      return {
        call_id: payload?.call_id,
        risk_score: 92,
        is_synthetic: true,
        status: "fraud",
        message: "Analysis completed (Mock Fallback)",
      };
    }
  },
};

export default analysisService;
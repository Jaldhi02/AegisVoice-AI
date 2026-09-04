import api from "./api";
import { getStoredMockCalls, saveMockCall, checkMockMode, mockCalls } from "./mockData";

export const callService = {
  /**
   * Upload an audio call file for fraud and deepfake detection
   * POST /api/calls/upload
   */
  uploadCall: async (formData, onProgress) => {
    if (checkMockMode()) {
      // Simulate realistic upload progress
      if (onProgress) {
        onProgress({ loaded: 25, total: 100 });
        await new Promise((r) => setTimeout(r, 200));
        onProgress({ loaded: 65, total: 100 });
        await new Promise((r) => setTimeout(r, 250));
        onProgress({ loaded: 100, total: 100 });
      }

      const file = formData.get("file");
      const callerNumber = formData.get("caller_number") || "+1 (800) 555-0921 (Newly Uploaded)";
      const isVoiceDeepfake = Math.random() > 0.4;
      const riskScore = isVoiceDeepfake ? Math.floor(Math.random() * 25) + 75 : Math.floor(Math.random() * 20) + 10;

      const newMockCall = {
        _id: `call_${Date.now()}`,
        id: `call_${Date.now()}`,
        caller_number: callerNumber,
        phone_number: callerNumber,
        created_at: new Date().toISOString(),
        duration: Math.floor(Math.random() * 80) + 30,
        duration_str: "01:15",
        risk_score: riskScore,
        confidence: 0.96,
        status: riskScore >= 60 ? "fraud" : "safe",
        is_synthetic: isVoiceDeepfake,
        scam_type: isVoiceDeepfake ? "Neural Voice Clone & Credential Coercion" : "Natural Verified Human",
        transcript: isVoiceDeepfake
          ? "Immediate action required regarding your security authorization. Please provide your 6-digit confirmation token to prevent account suspension."
          : "Hello, this is a routine confirmation regarding your recent scheduled appointment. Everything is approved.",
        voice_analysis: {
          is_synthetic: isVoiceDeepfake,
          synthetic_score: isVoiceDeepfake ? 0.94 : 0.08,
          confidence: 0.96,
          spectral_artifacts: isVoiceDeepfake ? 0.89 : 0.05,
          pitch_consistency: isVoiceDeepfake ? 0.41 : 0.91,
          clone_similarity: isVoiceDeepfake ? 0.88 : 0.04,
        },
        scam_analysis: {
          scam_score: riskScore,
          scam_type: isVoiceDeepfake ? "Urgency Pressure & OTP Harvesting" : "Benign Communication",
          urgency_level: isVoiceDeepfake ? "CRITICAL" : "NONE",
          tactics: [
            { name: "Urgency Pressure", detected: isVoiceDeepfake, description: "Manufactured emergency demanding immediate action" },
            { name: "Authority Impersonation", detected: isVoiceDeepfake, description: "Claims to represent Verification Services" },
            { name: "Credential Harvesting", detected: isVoiceDeepfake, description: "Demands 6-digit passcode" },
            { name: "Secrecy Coercion", detected: false, description: "None" },
          ],
        },
      };

      saveMockCall(newMockCall);
      return newMockCall;
    }

    try {
      return await api.post("/api/calls/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: onProgress,
      });
    } catch (err) {
      console.warn("Backend /api/calls/upload failed, falling back to mock upload:", err.message);
      // Fallback: simulate upload in mock mode
      const callerNumber = formData.get("caller_number") || "+1 (800) 555-0921 (Fallback)";
      const fallbackCall = {
        ...mockCalls[0],
        _id: `call_${Date.now()}`,
        id: `call_${Date.now()}`,
        caller_number: callerNumber,
        created_at: new Date().toISOString(),
      };
      saveMockCall(fallbackCall);
      return fallbackCall;
    }
  },

  /**
   * Retrieve list of recorded/analyzed calls
   * GET /api/calls
   */
  getCalls: async (params = {}) => {
    if (checkMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      return getStoredMockCalls();
    }

    try {
      return await api.get("/api/calls", { params });
    } catch (err) {
      console.warn("Backend /api/calls failed, falling back to mock call archive:", err.message);
      return getStoredMockCalls();
    }
  },

  /**
   * Retrieve details and analysis report for a specific call by ID
   * GET /api/calls/{id}
   */
  getCallById: async (id) => {
    if (checkMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      const calls = getStoredMockCalls();
      const found = calls.find((c) => String(c._id) === String(id) || String(c.id) === String(id));
      if (found) return found;

      // Generate realistic fallback call for unknown ID
      return {
        _id: id,
        id: id,
        caller_number: "+1 (800) 555-0149 (Simulated Line)",
        phone_number: "+1 (800) 555-0149",
        created_at: new Date().toISOString(),
        duration: 54,
        duration_str: "00:54",
        risk_score: 87,
        confidence: 0.96,
        status: "fraud",
        is_synthetic: true,
        scam_type: "AI Voice Impersonation & OTP Scam",
        transcript: "This is the Federal Security Center. Your authorization token has expired. You must immediately state your 6-digit confirmation code to prevent permanent suspension.",
        voice_analysis: {
          is_synthetic: true,
          synthetic_score: 0.91,
          confidence: 0.96,
          spectral_artifacts: 0.86,
          pitch_consistency: 0.42,
          clone_similarity: 0.87,
        },
        scam_analysis: {
          scam_score: 89,
          scam_type: "Authority Impersonation & Urgency",
          urgency_level: "HIGH",
          tactics: [
            { name: "Urgency Pressure", detected: true, description: "Immediate token request" },
            { name: "Authority Impersonation", detected: true, description: "Claims to represent Security Center" },
            { name: "Credential Harvesting", detected: true, description: "Demands 6-digit PIN" },
            { name: "Secrecy Coercion", detected: false, description: "None" },
          ],
        },
      };
    }

    try {
      return await api.get(`/api/calls/${id}`);
    } catch (err) {
      console.warn(`Backend /api/calls/${id} failed, falling back to mock details:`, err.message);
      const calls = getStoredMockCalls();
      const found = calls.find((c) => String(c._id) === String(id) || String(c.id) === String(id));
      return found || mockCalls[0];
    }
  },
};

export default callService;
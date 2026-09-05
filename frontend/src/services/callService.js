import api from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export const getFullAudioUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

export const normalizeCall = (call) => {
  if (!call) return null;
  const analysis = call.analysis || call;
  const va = call.voice_analysis || analysis.voice_analysis || {};

  const voiceConfidence = analysis.voice_confidence ?? analysis.confidence ?? va.confidence ?? 0;
  const scamConfidence = analysis.scam_confidence ?? 0;
  const isUnavailable = analysis.voice_status === "UNAVAILABLE" || va.voice_status === "UNAVAILABLE";
  const synthetic = analysis.voice_status === "AI_GENERATED" || Boolean(analysis.is_voice_clone) || Boolean(analysis.is_synthetic) || Boolean(va.is_synthetic);
  const scamDetected = Boolean(analysis.scam_detected || analysis.is_scam);

  // Compute accurate synthetic probability (0.0 to 1.0) or null if unavailable
  let syntheticScore = null;
  if (typeof analysis.clone_probability === "number") {
    syntheticScore = analysis.clone_probability;
  } else if (typeof analysis.synthetic_score === "number") {
    syntheticScore = analysis.synthetic_score;
  } else if (typeof va.synthetic_score === "number") {
    syntheticScore = va.synthetic_score;
  } else if (analysis.voice_status === "AI_GENERATED") {
    syntheticScore = voiceConfidence;
  } else if (analysis.voice_status === "REAL") {
    syntheticScore = Math.max(0, 1 - voiceConfidence);
  } else if (isUnavailable) {
    syntheticScore = null;
  } else if (typeof call.is_synthetic === "boolean") {
    syntheticScore = call.is_synthetic ? 0.85 : 0.15;
  } else {
    syntheticScore = null;
  }

  // Compute accurate scam score (0 to 100)
  let scamScore = 0;
  if (typeof analysis.scam_probability === "number") {
    scamScore = Math.round(analysis.scam_probability * 100);
  } else if (typeof analysis.scam_score === "number") {
    scamScore = analysis.scam_score;
  } else if (scamDetected) {
    scamScore = Math.round((scamConfidence || 0.85) * 100);
  } else {
    scamScore = Math.round(Math.max(0, 1 - (scamConfidence || 0.95)) * 100);
  }

  const reasons = analysis.reasons || va.reasons || [];
  
  // Composite risk score: prefer backend risk_score, or calculate weighted score if analysis is present
  let riskScore = call.risk_score ?? analysis.risk_score;
  if (typeof riskScore !== "number" || isNaN(riskScore)) {
    if (!isUnavailable && syntheticScore !== null) {
      riskScore = Math.round(0.55 * (syntheticScore * 100) + 0.45 * scamScore);
    } else {
      riskScore = undefined; // Insufficient evidence / unanalyzed
    }
  }

  const cid = call.id || call._id || analysis.call_id;
  const rawAudioUrl = call.audio_url || (cid ? `/api/calls/${cid}/audio` : null);
  const audioUrl = getFullAudioUrl(rawAudioUrl);

  const synthPct = typeof analysis.synthetic_probability === "number"
    ? analysis.synthetic_probability
    : (typeof va.synthetic_probability === "number"
        ? va.synthetic_probability
        : (syntheticScore !== null ? Math.round(syntheticScore * 1000) / 10 : null));

  const humanPct = typeof analysis.human_probability === "number"
    ? analysis.human_probability
    : (typeof va.human_probability === "number"
        ? va.human_probability
        : (synthPct !== null ? Math.round((100.0 - synthPct) * 10) / 10 : null));

  const mixedPct = typeof analysis.mixed_probability === "number"
    ? analysis.mixed_probability
    : (typeof va.mixed_probability === "number" ? va.mixed_probability : null);

  return {
    ...call,
    ...analysis,
    id: cid,
    risk_score: riskScore,
    risk_level: analysis.risk_level || (typeof riskScore === "number" ? (riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW") : "UNKNOWN"),
    confidence: voiceConfidence,
    is_synthetic: synthetic,
    transcript: analysis.transcript || call.transcript || "",
    audio_url: audioUrl,
    voice_analysis: {
      ...va,
      voice_status: analysis.voice_status || va.voice_status || (isUnavailable ? "UNAVAILABLE" : "UNKNOWN"),
      is_synthetic: synthetic,
      synthetic_score: syntheticScore,
      synthetic_probability: synthPct,
      human_probability: humanPct,
      mixed_probability: mixedPct,
      pitch_consistency: analysis.pitch_consistency ?? va.pitch_consistency,
      pitch_jitter: analysis.pitch_jitter ?? va.pitch_jitter,
      spectral_artifacts: analysis.spectral_artifacts ?? va.spectral_artifacts,
      spectral_inconsistency: analysis.spectral_inconsistency ?? va.spectral_inconsistency,
      clone_similarity: analysis.clone_similarity ?? va.clone_similarity,
      confidence: voiceConfidence,
      acoustic_anomalies: analysis.acoustic_anomalies || va.acoustic_anomalies || [],
    },
    scam_analysis: {
      scam_score: scamScore,
      scam_detected: scamDetected,
      scam_type: analysis.primary_category ? analysis.primary_category.replace(/_/g, " ") : (scamDetected ? "Scam indicators detected" : "No scam indicators detected"),
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

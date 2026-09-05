// Mock dataset for AI Voice Fraud Detection & Prevention System - Indian Cyber Security Domain

export const mockUser = {
  id: "usr_soc_0941",
  full_name: "Prathna (Lead Cyber Analyst)",
  email: "prathna@aegisvoice.in",
  role: "Lead Cybersecurity Analyst / Cyber Crime Cell",
  clearance_level: "TOP_SECRET_VOICE_INTEL",
  created_at: "2026-08-15T09:30:00Z",
  organization: "Indian Cyber Crime Coordination Centre (I4C)",
};

export const mockCalls = [
  {
    _id: "call_948201",
    id: "call_948201",
    caller_number: "+91 98765 43210 (Spoofed Executive Line - Mumbai)",
    phone_number: "+91 98765 43210",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    duration: 68,
    duration_str: "01:08",
    risk_score: 95,
    confidence: 0.98,
    status: "fraud",
    is_synthetic: true,
    scam_type: "CEO Deepfake Urgent IMPS Fund Transfer",
    audio_url: "https://example.com/audio/sample_deepfake_1.wav",
    transcript: "Rajesh, this is Vikram. I'm in an urgent closed-door board meeting in Delhi with our investors. We need an immediate IMPS transfer of ₹2,50,000 to escrow account 4892. Do not discuss this with anyone until the official announcement. Read back the OTP sent to your phone right now to authorize.",
    voice_analysis: {
      is_synthetic: true,
      synthetic_score: 0.96,
      confidence: 0.98,
      spectral_artifacts: 0.93,
      pitch_consistency: 0.38,
      clone_similarity: 0.91,
    },
    scam_analysis: {
      scam_score: 94,
      scam_type: "Executive Voice Clone & Financial Extortion",
      urgency_level: "CRITICAL",
      tactics: [
        { name: "Urgency Pressure", detected: true, description: "Demands immediate IMPS transaction under threat of deal collapse" },
        { name: "Authority Impersonation", detected: true, description: "Cloned voice of Director / Company Executive" },
        { name: "Financial Extraction", detected: true, description: "Requests immediate transfer of ₹2,50,000 to unverified account" },
        { name: "Secrecy Coercion", detected: true, description: "Explicit instruction to withhold details from finance team" },
      ],
    },
  },
  {
    _id: "call_948202",
    id: "call_948202",
    caller_number: "+91 94123 88901 (New Delhi - Cyber Police Spoof)",
    phone_number: "+91 94123 88901",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    duration: 114,
    duration_str: "01:54",
    risk_score: 89,
    confidence: 0.95,
    status: "fraud",
    is_synthetic: true,
    scam_type: "CBI Digital Arrest & Illegal Parcel Coercion",
    transcript: "This is Inspector Sharma from Crime Branch New Delhi. A parcel containing contraband linked to your Aadhaar card was intercepted at Customs. You are placed under Digital Arrest. Verify your identity by reading back the 6-digit OTP dispatched to your mobile or police will arrest you within 30 minutes.",
    voice_analysis: {
      is_synthetic: true,
      synthetic_score: 0.88,
      confidence: 0.95,
      spectral_artifacts: 0.82,
      pitch_consistency: 0.44,
      clone_similarity: 0.86,
    },
    scam_analysis: {
      scam_score: 91,
      scam_type: "Law Enforcement Impersonation & Digital Arrest",
      urgency_level: "CRITICAL",
      tactics: [
        { name: "Urgency Pressure", detected: true, description: "Threatens police detention within 30 minutes" },
        { name: "Authority Impersonation", detected: true, description: "Claims to represent Crime Branch & Central Agency" },
        { name: "Credential Harvesting", detected: true, description: "Demands 6-digit OTP authentication token" },
        { name: "Secrecy Coercion", detected: false, description: "Standard intimidation protocol" },
      ],
    },
  },
  {
    _id: "call_948203",
    id: "call_948203",
    caller_number: "+91 1800 123 4567 (Spoofed SBI Fraud Desk)",
    phone_number: "+91 1800 123 4567",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    duration: 82,
    duration_str: "01:22",
    risk_score: 82,
    confidence: 0.91,
    status: "fraud",
    is_synthetic: false,
    scam_type: "Banking Fraud Alert & OTP Harvesting",
    transcript: "Security alert from SBI Fraud Prevention Desk. Suspicious debit of ₹14,500 detected on your account. To reverse these fraudulent charges, speak your 6-digit UPI PIN and read the text OTP code sent to your handset immediately.",
    voice_analysis: {
      is_synthetic: false,
      synthetic_score: 0.32,
      confidence: 0.89,
      spectral_artifacts: 0.22,
      pitch_consistency: 0.85,
      clone_similarity: 0.15,
    },
    scam_analysis: {
      scam_score: 93,
      scam_type: "Bank Impersonation & Social Engineering",
      urgency_level: "HIGH",
      tactics: [
        { name: "Urgency Pressure", detected: true, description: "Manufactured emergency surrounding bank assets" },
        { name: "Authority Impersonation", detected: true, description: "Poses as SBI Fraud Prevention Department" },
        { name: "Credential Harvesting", detected: true, description: "Solicits PIN and OTP tokens" },
        { name: "Secrecy Coercion", detected: false, description: "Standard conversational flow" },
      ],
    },
  },
  {
    _id: "call_948204",
    id: "call_948204",
    caller_number: "+91 98200 11223 (Mumbai)",
    phone_number: "+91 98200 11223",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    duration: 27,
    duration_str: "00:27",
    risk_score: 52,
    confidence: 0.86,
    status: "suspicious",
    is_synthetic: false,
    scam_type: "High Pressure Crypto & Stock Tip Telemarketing",
    transcript: "Namaste! We have a limited-time stock allocation window closing in two hours. You need to verify your Demat account now before the IPO price explodes. Register at the link we sent to your WhatsApp immediately.",
    voice_analysis: {
      is_synthetic: false,
      synthetic_score: 0.15,
      confidence: 0.92,
      spectral_artifacts: 0.11,
      pitch_consistency: 0.88,
      clone_similarity: 0.08,
    },
    scam_analysis: {
      scam_score: 55,
      scam_type: "High Urgency Investment Telemarketing",
      urgency_level: "MODERATE",
      tactics: [
        { name: "Urgency Pressure", detected: true, description: "Artificial deadline of two hours" },
        { name: "Authority Impersonation", detected: false, description: "None" },
        { name: "Credential Harvesting", detected: false, description: "Requests external site signup" },
        { name: "Secrecy Coercion", detected: false, description: "None" },
      ],
    },
  },
  {
    _id: "call_948205",
    id: "call_948205",
    caller_number: "+91 98450 99887 (Bengaluru)",
    phone_number: "+91 98450 99887",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    duration: 94,
    duration_str: "01:34",
    risk_score: 14,
    confidence: 0.97,
    status: "safe",
    is_synthetic: false,
    scam_type: null,
    transcript: "Good morning! This is Priya from IT Helpdesk Bengaluru following up on ticket number 4920 regarding your laptop software update. Let me know when you are at your desk so we can configure the VPN.",
    voice_analysis: {
      is_synthetic: false,
      synthetic_score: 0.08,
      confidence: 0.97,
      spectral_artifacts: 0.06,
      pitch_consistency: 0.92,
      clone_similarity: 0.03,
    },
    scam_analysis: {
      scam_score: 10,
      scam_type: "Benign Internal Communication",
      urgency_level: "NONE",
      tactics: [
        { name: "Urgency Pressure", detected: false, description: "Standard scheduling" },
        { name: "Authority Impersonation", detected: false, description: "Authentic internal ticketing" },
        { name: "Credential Harvesting", detected: false, description: "No credentials requested" },
        { name: "Secrecy Coercion", detected: false, description: "None" },
      ],
    },
  },
  {
    _id: "call_948206",
    id: "call_948206",
    caller_number: "+91 98300 44332 (Kolkata)",
    phone_number: "+91 98300 44332",
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    duration: 152,
    duration_str: "02:32",
    risk_score: 9,
    confidence: 0.99,
    status: "safe",
    is_synthetic: false,
    scam_type: null,
    transcript: "Namaste team, calling in for our scheduled weekly infrastructure sync. We verified the cluster backups and all database replicas in Mumbai region are healthy.",
    voice_analysis: {
      is_synthetic: false,
      synthetic_score: 0.042,
      synthetic_probability: 4.2,
      human_probability: 95.8,
      confidence: 0.99,
      spectral_artifacts: 0.041,
      pitch_consistency: 0.952,
      clone_similarity: 0.024,
    },
    scam_analysis: {
      scam_score: 5,
      scam_type: "Benign Operational Review",
      urgency_level: "NONE",
      tactics: [
        { name: "Urgency Pressure", detected: false, description: "None" },
        { name: "Authority Impersonation", detected: false, description: "None" },
        { name: "Credential Harvesting", detected: false, description: "None" },
        { name: "Secrecy Coercion", detected: false, description: "None" },
      ],
    },
  },
];

// In-memory mock store that persists during page reloads via localStorage
export const getStoredMockCalls = () => {
  try {
    const saved = localStorage.getItem("aegis_mock_calls");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Could not read stored mock calls", e);
  }
  localStorage.setItem("aegis_mock_calls", JSON.stringify(mockCalls));
  return mockCalls;
};

export const saveMockCall = (newCall) => {
  const calls = getStoredMockCalls();
  const updated = [newCall, ...calls];
  localStorage.setItem("aegis_mock_calls", JSON.stringify(updated));
  return updated;
};

export const checkMockMode = () => {
  const localToggle = localStorage.getItem("aegis_mock_mode");
  if (localToggle !== null) return localToggle === "true";
  if (import.meta.env.VITE_USE_MOCK_DATA !== undefined) {
    return import.meta.env.VITE_USE_MOCK_DATA === "true";
  }
  return false;
};
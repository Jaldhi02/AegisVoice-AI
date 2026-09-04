// Mock dataset for AI Voice Fraud Detection & Prevention System

export const mockUser = {
  id: "usr_soc_0941",
  full_name: "Prathna (Lead UI-UX Analyst)",
  email: "prathna@aegisvoice.defense",
  role: "Lead Cybersecurity Analyst / SOC Tier-2",
  clearance_level: "TOP_SECRET_VOICE_INTEL",
  created_at: "2026-08-15T09:30:00Z",
  organization: "Global AI Defense Consortium",
};

export const mockCalls = [
  {
    _id: "call_948201",
    id: "call_948201",
    caller_number: "+1 (415) 890-2144 (Spoofed Executive Line)",
    phone_number: "+1 (415) 890-2144",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    duration: 68,
    duration_str: "01:08",
    risk_score: 95,
    confidence: 0.98,
    status: "fraud",
    is_synthetic: true,
    scam_type: "CEO Deepfake Urgent Wire Transfer",
    audio_url: "https://example.com/audio/sample_deepfake_1.wav",
    transcript: "David, it's Richard. I'm in a closed-door meeting with the board and our acquisition partners. We need an immediate wire transfer of $250,000 to escrow account 8492. Do not discuss this with anyone until the press release tomorrow. Read back the one-time authorization code on your screen now to finalize.",
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
        { name: "Urgency Pressure", detected: true, description: "Demands immediate action under threat of deal collapse" },
        { name: "Authority Impersonation", detected: true, description: "Cloned voice of Company CEO / Executive Director" },
        { name: "Financial Extraction", detected: true, description: "Requests immediate wire transfer to unverified escrow" },
        { name: "Secrecy Coercion", detected: true, description: "Explicit instruction to withhold details from staff" },
      ],
    },
  },
  {
    _id: "call_948202",
    id: "call_948202",
    caller_number: "+1 (202) 555-0182 (Washington DC)",
    phone_number: "+1 (202) 555-0182",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    duration: 114,
    duration_str: "01:54",
    risk_score: 89,
    confidence: 0.95,
    status: "fraud",
    is_synthetic: true,
    scam_type: "Federal Enforcement Warrant & Tax Extortion",
    transcript: "This is Officer Miller from Federal Enforcement. Your account has been permanently suspended due to international illicit wire activities. You must verify your identity immediately by reading back the one-time 6-digit security code sent to your mobile phone. Failure to do so will result in an arrest warrant within 30 minutes.",
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
      scam_type: "Law Enforcement Impersonation & Arrest Threat",
      urgency_level: "CRITICAL",
      tactics: [
        { name: "Urgency Pressure", detected: true, description: "Threatens legal detention within 30 minutes" },
        { name: "Authority Impersonation", detected: true, description: "Claims to represent Federal Agency Enforcement" },
        { name: "Credential Harvesting", detected: true, description: "Demands 6-digit authentication token" },
        { name: "Secrecy Coercion", detected: false, description: "Standard intimidation protocol" },
      ],
    },
  },
  {
    _id: "call_948203",
    id: "call_948203",
    caller_number: "+1 (800) 432-1000 (Spoofed Bank Support)",
    phone_number: "+1 (800) 432-1000",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    duration: 82,
    duration_str: "01:22",
    risk_score: 82,
    confidence: 0.91,
    status: "fraud",
    is_synthetic: false,
    scam_type: "Banking Fraud Alert & OTP Harvesting",
    transcript: "Security alert from Fraud Prevention. Suspicious debit charges detected on your card. To reverse these fraudulent transactions, please speak your 6-digit security pin and read the text confirmation code dispatched to your handset immediately.",
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
        { name: "Authority Impersonation", detected: true, description: "Poses as Fraud Prevention Department" },
        { name: "Credential Harvesting", detected: true, description: "Solicits PIN and OTP tokens" },
        { name: "Secrecy Coercion", detected: false, description: "Standard conversational flow" },
      ],
    },
  },
  {
    _id: "call_948204",
    id: "call_948204",
    caller_number: "+1 (646) 321-9988 (New York, NY)",
    phone_number: "+1 (646) 321-9988",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    duration: 45,
    duration_str: "00:45",
    risk_score: 52,
    confidence: 0.86,
    status: "suspicious",
    is_synthetic: false,
    scam_type: "High Pressure Sales & Crypto Telemarketing",
    transcript: "Hey there! We have a limited-time crypto allocation window closing in two hours. You need to verify your wallet address now before the initial price explodes. Sign up at the link we send you right now.",
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
    caller_number: "+1 (512) 400-2211 (Austin, TX)",
    phone_number: "+1 (512) 400-2211",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    duration: 94,
    duration_str: "01:34",
    risk_score: 14,
    confidence: 0.97,
    status: "safe",
    is_synthetic: false,
    scam_type: null,
    transcript: "Good morning! This is Sarah from IT Support following up on ticket number 4920 regarding your dual-monitor docking station. Let me know when you are at your desk so we can configure the firmware update.",
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
    caller_number: "+1 (212) 990-4433 (New York, NY)",
    phone_number: "+1 (212) 990-4433",
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    duration: 152,
    duration_str: "02:32",
    risk_score: 9,
    confidence: 0.99,
    status: "safe",
    is_synthetic: false,
    scam_type: null,
    transcript: "Hello team, calling in for our scheduled weekly infrastructure synchronization. We verified the cluster backups and all MongoDB Atlas replicas are green. We will send the review notes over email this afternoon.",
    voice_analysis: {
      is_synthetic: false,
      synthetic_score: 0.05,
      confidence: 0.99,
      spectral_artifacts: 0.04,
      pitch_consistency: 0.95,
      clone_similarity: 0.02,
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
  // If explicitly enabled via environment variable
  if (import.meta.env.VITE_USE_MOCK_DATA === "true") return true;
  // Or if toggled on in localStorage by the user
  const localToggle = localStorage.getItem("aegis_mock_mode");
  if (localToggle !== null) return localToggle === "true";
  // Default to true for seamless hackathon / offline demonstration
  return true;
};
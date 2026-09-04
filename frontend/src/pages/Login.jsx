import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

/**
 * Animated Particle Network Canvas (Light Mode Cyan & Blue Constellation Mesh)
 */
const ParticleNetwork = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse coordinates for gentle interactive connection
    const mouse = { x: null, y: null, radius: 140 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Particle nodes configuration (higher density & vibrant visibility)
    const particleCount = Math.min(Math.floor((width * height) / 10000), 110);
    const particles = [];
    const colors = [
      { r: 2, g: 132, b: 199 },   // electric sky-600
      { r: 14, g: 165, b: 233 },  // cyan-500
      { r: 37, g: 99, b: 235 },   // royal blue-600
      { r: 30, g: 58, b: 138 },   // sapphire blue-900
    ];

    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.2 + 2.0,
        color: color,
        alpha: Math.random() * 0.3 + 0.65,
        pulseSpeed: Math.random() * 0.02 + 0.008,
      });
    }

    const maxDistance = 140;

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off canvas boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Subtle alpha pulsation
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.002;
        const currentAlpha = Math.max(0.45, Math.min(0.95, p.alpha));

        // Draw particle dot with cyan/blue glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.7)`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset for lines

        // Draw network connections between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.52;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(2, 132, 199, ${lineAlpha})`;
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }
        }

        // Draw connection to mouse position if nearby
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const mouseLineAlpha = (1 - dist / mouse.radius) * 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${mouseLineAlpha})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-100"
    />
  );
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/";

  const handleQuickFill = () => {
    setEmail("prathna@aegisvoice.defense");
    setPassword("password123");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email/username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({ email, username: email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      {/* Animated Blue & Cyan Particle Network Constellation Canvas */}
      <ParticleNetwork />

      {/* Ambient background soft glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Centered Sleek Glassmorphic Authentication Card */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="cyber-panel p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-300/40 bg-white">
          {/* Top Accent Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 mb-2.5 shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              AegisVoice Security Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to access real-time voice fraud telemetry
            </p>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-sky-200 flex items-center justify-between gap-3 text-xs shadow-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sky-700 font-semibold">
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                <span>Demo Analyst Credentials</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-mono truncate">
                prathna@aegisvoice.defense • password123
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-all hover:scale-105 shrink-0 text-xs shadow-xs"
            >
              Auto-Fill
            </button>
          </div>

          {error && (
            <ErrorMessage
              title="Authentication Failed"
              message={error}
              onDismiss={() => setError(null)}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Analyst Email / Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@aegisvoice.defense"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Security Passkey
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 hover:shadow-sky-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loading size="sm" message="Authenticating credentials..." />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600">
            New analyst joining the team?{" "}
            <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-800 transition-colors underline decoration-sky-500/40 hover:decoration-sky-600">
              Register Clearance
            </Link>
          </div>
        </div>

        {/* Security Compliance Footer */}
        <div className="mt-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted with AES-256 and JWT Token Verification</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
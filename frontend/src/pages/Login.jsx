import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import FaceScannerModal from "../components/FaceScannerModal";
import { Scan, ShieldCheck, User, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import "./Login.css";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Remembered username initialization
  const rememberedUser = typeof window !== "undefined" ? localStorage.getItem("manufacturing_remembered_username") || "" : "";

  // Authentication Form States (Password is strictly empty by default)
  const [username, setUsername] = useState(rememberedUser);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedUser));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFaceModal, setShowFaceModal] = useState(false);

  // Forgot Password / Recovery States
  const [viewMode, setViewMode] = useState("login"); // 'login' | 'forgot'
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const passwordInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate("/command-center", { replace: true });
    }
  }, [user, navigate]);

  // Demo Account Selector: Fills username only, leaves password empty, focuses password field
  const handleSelectDemoAccount = (selectedUsername) => {
    setUsername(selectedUsername);
    setPassword(""); // Do NOT fill password automatically
    setError("");

    // Move focus to the password field so user can manually enter credentials
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 50);
  };

  // Sign In Form Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = (username || "").trim();
    const trimmedPassword = (password || "").trim();

    if (!trimmedUsername && !trimmedPassword) {
      setError("Please enter your username and password.");
      if (usernameInputRef.current) usernameInputRef.current.focus();
      return;
    }

    if (!trimmedUsername) {
      setError("Please enter your username.");
      if (usernameInputRef.current) usernameInputRef.current.focus();
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password.");
      if (passwordInputRef.current) passwordInputRef.current.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedUsername, password, rememberMe);
      if (res.success) {
        navigate("/command-center", { replace: true });
      } else {
        setError(res.error || "Invalid username or password.");
      }
    } catch (err) {
      setError("An unexpected authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Recovery Request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    const trimmed = (forgotIdentifier || "").trim();
    if (!trimmed) {
      setForgotError("Please enter your username or registered enterprise email.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        username_or_email: trimmed
      });
      setForgotSuccess(res.data.message || "Password recovery request dispatched successfully.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setForgotError(
        detail || "Unable to process recovery request. Please check your network or contact factory IT."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFaceScanSuccess = (userData) => {
    setShowFaceModal(false);
    navigate("/command-center", { replace: true });
  };

  return (
    <div className="login-page">
      {/* Biometric Face Scanner Modal */}
      {showFaceModal && (
        <FaceScannerModal
          username={username}
          onClose={() => setShowFaceModal(false)}
          onSuccess={handleFaceScanSuccess}
        />
      )}

      {/* LEFT BRANDING SECTION */}
      <div className="login-brand">
        <div className="brand-content">
          <div className="company-logo">
            <div className="logo-icon">AI</div>
            <div>
              <h2>NEXUSPROD</h2>
              <span>SMART MANUFACTURING</span>
            </div>
          </div>

          <div className="brand-main">
            <div className="ai-badge">● INDUSTRY 4.0 AI SUITE</div>

            <h1>
              Intelligent
              <br />
              <span>Smart Factory Platform</span>
            </h1>

            <p>
              Optimize production, monitor machines, predict maintenance,
              manage inventory, run What-If simulations, and track OEE
              with artificial intelligence.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature">
              <div className="feature-icon">⚙</div>
              <div>
                <strong>AI Factory Copilot & OEE</strong>
                <small>Real-time conversational intelligence & OEE metrics</small>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">◉</div>
              <div>
                <strong>Predictive Maintenance & Work Orders</strong>
                <small>Automated 5-Why root cause analysis & dispatch</small>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">▣</div>
              <div>
                <strong>Digital Twin & What-If Simulation</strong>
                <small>Dynamic alternative routing and bottleneck modeling</small>
              </div>
            </div>
          </div>

          <div className="copyright">
            © 2026 NEXUSPROD AI · Intelligent Smart Factory Management Platform
          </div>
        </div>
      </div>

      {/* RIGHT AUTHENTICATION SECTION */}
      <div className="login-section">
        <div className="login-card">
          <div className="mobile-logo">
            <div className="logo-icon">AI</div>
            <div>
              <h2>NEXUSPROD</h2>
              <span>SMART MANUFACTURING</span>
            </div>
          </div>

          {/* VIEW 1: STANDARD SIGN IN */}
          {viewMode === "login" ? (
            <>
              <div className="login-header">
                <span className="welcome">INDUSTRY 4.0 PORTAL</span>
                <h1>Sign in to your account</h1>
                <p>Select a demo role or enter authorization credentials</p>
              </div>

              <form onSubmit={handleLogin} noValidate>
                {/* USERNAME */}
                <div className="input-group">
                  <label htmlFor="login-username">USERNAME</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      id="login-username"
                      ref={usernameInputRef}
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="input-group">
                  <label htmlFor="login-password">PASSWORD</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="login-password"
                      ref={passwordInputRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="show-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* OPTIONS (Remember Me & Forgot Password) */}
                <div className="login-options">
                  <label className="remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="forgot"
                    onClick={() => {
                      setViewMode("forgot");
                      setError("");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* ERROR FEEDBACK */}
                {error && (
                  <div className="login-error" role="alert">
                    <span>!</span>
                    <div>{error}</div>
                  </div>
                )}

                {/* SIGN IN BUTTON */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>

                {/* BIOMETRIC FACE SCANNER BUTTON */}
                <button
                  type="button"
                  className="face-login-button"
                  onClick={() => setShowFaceModal(true)}
                  disabled={loading}
                >
                  <Scan size={18} />
                  <span>Biometric Face Scan Sign In</span>
                </button>
              </form>

              {/* DEMO ACCOUNT SELECTION (FILLS USERNAME ONLY) */}
              <div className="demo-roles" style={{ marginTop: "18px" }}>
                <div className="demo-roles-title">DEMO ACCOUNTS (SELECT TO FILL USERNAME)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => handleSelectDemoAccount("plant_mgr")}
                    style={{
                      gridColumn: "span 2",
                      padding: "8px 10px",
                      fontSize: "0.78rem",
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                    title="Click to fill username as plant_mgr"
                  >
                    <span>👑 Plant Manager</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>(plant_mgr)</span>
                  </button>

                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => handleSelectDemoAccount("prod_mgr")}
                    style={{ padding: "6px 8px", fontSize: "0.74rem" }}
                    title="Click to fill username as prod_mgr"
                  >
                    ⚙ Production Mgr (prod_mgr)
                  </button>

                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => handleSelectDemoAccount("maint_mgr")}
                    style={{ padding: "6px 8px", fontSize: "0.74rem" }}
                    title="Click to fill username as maint_mgr"
                  >
                    🔧 Maintenance Mgr (maint_mgr)
                  </button>

                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => handleSelectDemoAccount("quality_mgr")}
                    style={{ padding: "6px 8px", fontSize: "0.74rem" }}
                    title="Click to fill username as quality_mgr"
                  >
                    🛡 Quality Mgr (quality_mgr)
                  </button>

                  <button
                    type="button"
                    className="demo-btn"
                    onClick={() => handleSelectDemoAccount("operator_1")}
                    style={{ padding: "6px 8px", fontSize: "0.74rem" }}
                    title="Click to fill username as operator_1"
                  >
                    👤 Operator (operator_1)
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* VIEW 2: PROFESSIONAL FORGOT PASSWORD / RECOVERY */
            <div className="forgot-password-view">
              <div className="login-header">
                <span className="welcome">ACCOUNT RECOVERY</span>
                <h1>Reset Password</h1>
                <p>Enter your username or registered factory email address</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} noValidate>
                <div className="input-group">
                  <label htmlFor="recovery-identifier">USERNAME OR REGISTERED EMAIL</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      id="recovery-identifier"
                      type="text"
                      placeholder="e.g. plant_mgr or plant.manager@factory.com"
                      value={forgotIdentifier}
                      onChange={(e) => {
                        setForgotIdentifier(e.target.value);
                        setForgotError("");
                      }}
                      autoComplete="username"
                      disabled={forgotLoading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* ERROR FEEDBACK */}
                {forgotError && (
                  <div className="login-error" role="alert">
                    <span>!</span>
                    <div>{forgotError}</div>
                  </div>
                )}

                {/* SUCCESS FEEDBACK */}
                {forgotSuccess && (
                  <div className="login-success" role="status">
                    <span>✓</span>
                    <div>{forgotSuccess}</div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={forgotLoading}
                  style={{ marginTop: "12px" }}
                >
                  {forgotLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Recovery Request</span>
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>

                {/* BACK TO LOGIN LINK */}
                <div style={{ marginTop: "18px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="forgot"
                    onClick={() => {
                      setViewMode("login");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>

              {/* DEMO ENVIRONMENT ASSISTANCE NOTE */}
              <div className="security-info" style={{ marginTop: "24px" }}>
                <span>ℹ️</span>
                <div>
                  <strong>Development & Demo Environment Assistance</strong>
                  <p>
                    For testing and demonstration, accounts are pre-configured. If you need assistance with credentials, contact the Plant Administrator or reference your internal deployment documentation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY ARMOR FOOTER */}
          <div className="security-info">
            <span>🔐</span>
            <div>
              <strong>AES-256 Armored Security & RBAC</strong>
              <p>Your session is protected with bcrypt hashing, JWT bearer tokens, and brute-force rate limiting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

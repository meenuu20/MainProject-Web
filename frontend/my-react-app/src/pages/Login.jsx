import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getKeyForEmail } from "../config/adminKeys";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) return setError("Please enter an email.");
    if (!code) return setError("Please enter your access code.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");

    const expected = getKeyForEmail(email.toLowerCase());
    if (!expected) return setError("This account is not authorized.");
    if (code !== expected) return setError("Invalid access code.");

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      login(email, { role: "admin" });
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
      setCode("");
    }
  }

  return (
    <div className="container login-shell">
      <div className="login-panel card">
        <span className="eyebrow">Secured Authority Access</span>
        <h2>Authority Login</h2>
        <p className="muted">Sign in with your registered authority email and personal access code.</p>

        <form onSubmit={handleSubmit} className="login-grid" style={{ marginTop: 14 }}>
          <label className="muted" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@authority.org"
            autoFocus
          />

          <label className="muted" htmlFor="code">Access Code</label>

          <div style={{ position: "relative" }}>
            <input
              id="code"
              className="input"
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your access code"
              autoComplete="off"
              aria-describedby="toggle-code-visibility"
            />

            <button
              type="button"
              id="toggle-code-visibility"
              aria-label={showCode ? "Hide access code" : "Show access code"}
              title={showCode ? "Hide access code" : "Show access code"}
              onClick={() => setShowCode((state) => !state)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#8ca3bf",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showCode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.78 12.24C3.84 9.86 6.74 7 12 7c2.03 0 3.7.46 5.03 1.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.97 15.06C13.66 15.7 12 16.12 10 16.12 6.74 16.12 3.84 13.26 2.78 10.88" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {error && <div style={{ color: "#ff98a4" }}>{error}</div>}

          <div className="panel-actions" style={{ marginTop: 6 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEmail("alice@authority.org");
                setCode(getKeyForEmail("alice@authority.org"));
              }}
            >
              Fill Demo
            </button>
          </div>

          <div className="login-note">
            This demo stores per-user codes in the frontend. For real security, validate on a backend server.
          </div>
        </form>
      </div>
    </div>
  );
}

// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getKeyForEmail } from "../config/adminKeys";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false); // <- visibility toggle

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
      await new Promise((r) => setTimeout(r, 400));
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
    <div className="container" style={{ paddingTop: 28 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Authority Login</h2>
          <p className="muted">Sign in with your registered authority email and personal access code.</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
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

            <label className="muted" htmlFor="code" style={{ marginTop: 10, display: "block" }}>
              Access Code
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="code"
                className="input"
                type={showCode ? "text" : "password"}          // <-- toggle here
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your access code"
                autoComplete="off"
                aria-describedby="toggle-code-visibility"
              />

              {/* visibility toggle button */}
              <button
                type="button"
                id="toggle-code-visibility"
                aria-label={showCode ? "Hide access code" : "Show access code"}
                title={showCode ? "Hide access code" : "Show access code"}
                onClick={() => setShowCode((s) => !s)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* simple SVG eye / eye-off icons */}
                {showCode ? (
                  // eye-off
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.78 12.24C3.84 9.86 6.74 7 12 7c2.03 0 3.7.46 5.03 1.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.97 15.06C13.66 15.7 12 16.12 10 16.12 6.74 16.12 3.84 13.26 2.78 10.88" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  // eye
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>

            {error && <div style={{ color: "#b91c1c", marginTop: 10 }}>{error}</div>}

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEmail("alice@authority.org");
                  setCode(getKeyForEmail("alice@authority.org"));
                }}
              >
                Fill demo
              </button>
            </div>

            <div style={{ marginTop: 12 }} className="muted">
              This demo stores per-user codes in the frontend. For real security, validate on a backend server.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
